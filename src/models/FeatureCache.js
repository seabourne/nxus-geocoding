'use strict'

import {BaseModel} from 'nxus-storage'

/** FeatureCache holds cached GeoJSON Feature objects.
 */
const FeatureCache = BaseModel.extend(
  /** @lends FeatureCache */
  {
    identity: 'feature_cache',
    connection: 'default',
    attributes: {
      /** Unique identifier.
       * Open Street Map identifiers are coded as "osm:<id>".
       */
      uid: {
        type: 'string',
        required: true,
        unique: true
      },
      /** GeoJSON properties object.
       */
      properties: {
        type: 'json'
      },
      /** GeoJSON geometry object.
       */
      geometry: {
        type: 'json'
      }

    }
  })

export {FeatureCache as default}
