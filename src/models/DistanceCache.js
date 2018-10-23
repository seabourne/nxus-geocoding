'use strict'

import {BaseModel} from 'nxus-storage'

/** DistanceCache holds cached routing distance information.
 */
const DistanceCache = BaseModel.extend(
  /** @lends DistanceCache */
  {
    identity: 'distance_cache',
    connection: 'default',
    attributes: {
      /** Unique identifier of start location.
       * Open Street Map identifiers are coded as "osm:<id>".
       */
      fromUid: {
        type: 'string',
        required: true
      },
      /** Unique identifier of end location.
       * Open Street Map identifiers are coded as "osm:<id>".
       */
      toUid: {
        type: 'string',
        required: true
      },
      /** Routing distance (in meters).
       */
      distance: {
        type: 'float'
      }
    }
  })

export {DistanceCache as default}
