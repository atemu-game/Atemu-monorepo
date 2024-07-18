import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosInstance } from 'axios';
import { typeOfVal } from '@app/shared/utils';
import configuration from '@app/shared/configuration';
import { MetaDataDto } from './dtos/metadata.dto';
import { isURL } from 'class-validator';
import mime from 'mime';
import {
  CardCollectionDocument,
  CardCollections,
  CardDocument,
  Cards,
} from '@app/shared/models';
import { Web3Service } from '@app/web3/web3.service';
import { Attribute, AttributeMap } from '@app/shared/types';

const getUrl = (url: string) => {
  if (url.startsWith('ipfs://')) {
    return url?.replace('ipfs://', configuration().IPFS_GATEWAY);
  }

  if (url.startsWith('https://ipfs.io/ipfs/')) {
    return url?.replace('https://ipfs.io/ipfs/', configuration().IPFS_GATEWAY);
  }
  return url;
};

@Injectable()
export class MetadataService {
  constructor(
    @InjectModel(Cards.name)
    private readonly cardModel: Model<CardDocument>,
    @InjectModel(CardCollections.name)
    private readonly cardCollectionModel: Model<CardCollectionDocument>,
    private readonly web3Service: Web3Service,
  ) {
    this.client = axios.create({
      timeout: 1000 * 60, // Wait for 5 seconds
    });
  }
  client: AxiosInstance;
  logger = new Logger(MetadataService.name);

  async loadMetadata(id: string) {
    const card = await this.cardModel
      .findById(id, { tokenUri: 0 })
      .populate(['cardCollection', 'chain']);

    const { cardContract, cardCollection, cardId, chain } = card;
    const { standard } = cardCollection;

    const tokenURI = await this.web3Service.getCardUri(
      cardContract,
      cardId,
      standard,
      chain.rpc,
    );
    if (!tokenURI) return null;

    const httpUrl = getUrl(tokenURI);

    this.logger.debug(
      `tokenUrl of ${card.cardContract}:${cardId} is '${httpUrl}'`,
    );

    let metadata: MetaDataDto;
    if (!isURL(httpUrl)) {
      // try to parse data of encoded base64 file
      const parsedDataBase64 = this.parseJSON(tokenURI);
      if (!parsedDataBase64) {
        this.logger.warn(
          `tokenUrl of ${card.cardContract}:${cardId} is ${tokenURI} - not an validate url, skip`,
        );
        card.tokenUri = tokenURI;
        await card.save();
        return;
      }
      metadata = parsedDataBase64;
    } else {
      try {
        metadata = (await this.client.get(httpUrl)).data;
      } catch (error) {
        card.tokenUri = tokenURI;
        await card.save();
        throw new Error(error);
      }
    }

    const attributes =
      metadata.attributes
        ?.filter(
          ({ value }) =>
            value !== null &&
            value !== undefined &&
            String(value).trim() !== '',
        )
        .map(({ trait_type, value, display_type }) => ({
          trait_type: trait_type,
          value: value,
          display_type,
        })) || [];
    let animationFileType = undefined;
    try {
      if (metadata.animation_url) {
        const animation_url = getUrl(metadata.animation_url);
        const mimeType = mime.getType(animation_url);
        if (mimeType) {
          animationFileType = mimeType;
        } else {
          const headers = (await axios.head(animation_url)).headers;
          animationFileType = headers['content-type'];
        }
      }
    } catch (error) {
      this.logger.warn(error);
    }

    await this.cardModel.updateOne(
      { _id: id },
      {
        $set: {
          name: metadata.name,
          image: metadata.image,
          originImage: metadata.image,
          description: metadata.description,
          attributes,
          tokenUri: tokenURI,
          externalUrl: metadata.externalUrl,
          animationUrl: metadata.animation_url,
          animationPlayType: animationFileType,
        },
      },
    );
    await this.reloadAttributeMap(card.cardCollection, attributes);
    return true;
  }

  async reloadAttributeMap(
    cardCollection: CardCollections,
    attributes: Attribute[],
  ) {
    const { attributesMap } = cardCollection;
    for (const attr of attributes) {
      const valType = typeOfVal(attr.value);
      const attributeMap = attributesMap.find(
        (attrMap) => attrMap.label === attr.trait_type,
      );
      if (attributeMap) {
        if (valType == 'number') {
          attributeMap.min =
            attributeMap.min < attr.value ? attributeMap.min : attr.value;
          attributeMap.max =
            attributeMap.max > attr.value ? attributeMap.max : attr.value;
        }
        if (valType == 'string') {
          if (!attributeMap.options.includes(attr.value)) {
            attributeMap.options.push(attr.value);
          }
        }
      } else {
        const newAttrMap: AttributeMap = {
          trait_type: attr.trait_type,
          label: attr.trait_type,
          type: valType,
        };
        if (valType == 'number') {
          newAttrMap.min = 0;
          newAttrMap.max = attr.value;
        }
        if (valType == 'string') {
          newAttrMap.options = [attr.value];
        }
        attributesMap.push(newAttrMap);
      }
    }
    await this.cardCollectionModel.updateOne(
      {
        _id: cardCollection._id,
      },
      cardCollection,
    );
  }

  parseJSON(dataURI: string): any {
    try {
      // Check for Base64 encoding
      const base64Prefix = 'base64,';
      const isBase64 = dataURI.indexOf(base64Prefix) > -1;
      let jsonPart;

      if (isBase64) {
        // Extract and decode the Base64 part
        const base64EncodedJson = dataURI.substring(
          dataURI.indexOf(base64Prefix) + base64Prefix.length,
        );
        const decodedJson = atob(base64EncodedJson); // `atob` is used to decode Base64 content
        jsonPart = decodedJson;
      } else {
        // Simply remove the prefix and decode URI-encoded parts
        jsonPart = dataURI.substring(dataURI.indexOf(',') + 1);
        jsonPart = decodeURIComponent(jsonPart);
      }

      // Parse the JSON string into an object
      return JSON.parse(jsonPart);
    } catch (error) {
      return undefined;
    }
  }
}
