'use strict'

import {URL} from 'url'

import {application as app} from 'nxus-core'
import {HasModels} from 'nxus-storage'
import {router} from 'nxus-router'
import {users} from 'nxus-users'

import request from 'request-promise-native'

import {pick} from 'lodash'

function splitURL(str) {
  let url = new URL(str),
      params = {}
  url.searchParams.forEach((value, name) => { params[name] = value })
  return [url.origin + url.pathname, params]
}

const usaDefault = 'United States of America'

const usaStateSynonyms = {
  'al': 'Alabama',
  'ak': 'Alaska',
  'az': 'Arizona',
  'ar': 'Arkansas',
  'ca': 'California',
  'co': 'Colorado',
  'ct': 'Connecticut',
  'de': 'Delaware',
  'fl': 'Florida',
  'ga': 'Georgia',
  'hi': 'Hawaii',
  'id': 'Idaho',
  'il': 'Illinois',
  'in': 'Indiana',
  'ia': 'Iowa',
  'ks': 'Kansas',
  'ky': 'Kentucky',
  'la': 'Louisiana',
  'me': 'Maine',
  'md': 'Maryland',
  'ma': 'Massachusetts',
  'mi': 'Michigan',
  'mn': 'Minnesota',
  'ms': 'Mississippi',
  'mo': 'Missouri',
  'mt': 'Montana',
  'ne': 'Nebraska',
  'nv': 'Nevada',
  'nh': 'New Hampshire',
  'nj': 'New Jersey',
  'nm': 'New Mexico',
  'ny': 'New York',
  'nc': 'North Carolina',
  'nd': 'North Dakota',
  'oh': 'Ohio',
  'ok': 'Oklahoma',
  'or': 'Oregon',
  'pa': 'Pennsylvania',
  'ri': 'Rhode Island',
  'sc': 'South Carolina',
  'sd': 'South Dakota',
  'tn': 'Tennessee',
  'tx': 'Texas',
  'ut': 'Utah',
  'vt': 'Vermont',
  'va': 'Virginia',
  'wa': 'Washington',
  'wv': 'West Virginia',
  'wi': 'Wisconsin',
  'wy': 'Wyoming',
  'dc': 'District of Columbia',
  'as': 'American Samoa',
  'gu': 'Guam',
  'mp': 'Northern Mariana Islands',
  'pr': 'Puerto Rico',
  'um': 'United States Minor Outlying Islands',
  'vi': 'United States Virgin Islands' }

const usaStateAbbreviations = {
  'alabama':              'AL',
  'alaska':               'AK',
  'arizona':              'AZ',
  'arkansas':             'AR',
  'california':           'CA',
  'colorado':             'CO',
  'connecticut':          'CT',
  'delaware':             'DE',
  'florida':              'FL',
  'georgia':              'GA',
  'hawaii':               'HI',
  'idaho':                'ID',
  'illinois':             'IL',
  'indiana':              'IN',
  'iowa':                 'IA',
  'kansas':               'KS',
  'kentucky':             'KY',
  'louisiana':            'LA',
  'maine':                'ME',
  'maryland':             'MD',
  'massachusetts':        'MA',
  'michigan':             'MI',
  'minnesota':            'MN',
  'mississippi':          'MS',
  'missouri':             'MO',
  'montana':              'MT',
  'nebraska':             'NE',
  'nevada':               'NV',
  'new hampshire':        'NH',
  'new jersey':           'NJ',
  'new mexico':           'NM',
  'new york':             'NY',
  'north carolina':       'NC',
  'north dakota':         'ND',
  'ohio':                 'OH',
  'oklahoma':             'OK',
  'oregon':               'OR',
  'pennsylvania':         'PA',
  'rhode island':         'RI',
  'south carolina':       'SC',
  'south dakota':         'SD',
  'tennessee':            'TN',
  'texas':                'TX',
  'utah':                 'UT',
  'vermont':              'VT',
  'virginia':             'VA',
  'washington':           'WA',
  'west virginia':        'WV',
  'wisconsin':            'WI',
  'wyoming':              'WY',
  'district of columbia': 'DC',
  'american samoa':       'AS',
  'guam':                 'GU',
  'northern mariana islands': 'MP',
  'puerto rico':          'PR',
  'united states minor outlying islands': 'UM',
  'united states virgin islands': 'VI'}

const countryAbbreviations = {
  'united states of america': 'usa'
}

/* Normalize inconsistent OSM names to ISO 3166 country names.
  Main reason for this is to clean up "USA" as variant of "United States
  of America". Some of the other synonyms map obsoleted names to the
  current standard.

  BTW, OSM practice seems to drop the leading "The" from country names.

  Didn't deal with these:
    "Creedon Republic" (OSM vandalism)
    "Spain (territorial waters)"
    "Territorial waters of Bornholm"
    "United States of America (Island of Hawai'i territorial waters)"
 */
const countryJunk = {
  'b&h':                  'Bosnia and Herzegovina',
  'czech republic':       'Czechia',
  'd.r.':                 'Dominican Republic',
  'dr congo':             'Democratic Republic of the Congo',
  'iran':                 'Islamic Republic of Iran',
  'laos':                 'Lao People\'s Democratic Republic',
  'palestinian territories': 'State of Palestine',
  'prc':                  'China',
  'roc':                  'Taiwan',
  'rsa':                  'South Africa',
  'russia':               'Russian Federation',
  'south korea':          'Republic of Korea',
  'tanzania':             'United Republic of Tanzania',
  'the bahamas':          'Bahamas',
  'the netherlands':      'Netherlands',
  'united states of america (american samoa)': 'American Samoa',
  'usa':                  'United States of America'
}


/* The GraphHopper location matric service returns a random assortment
 * of errors when it fails to find a route. Here we attempt to decipher
 * the various "expected" errors, to distinguish them from "unexpected"
 * errors that indicate potential coding errors. Obviously, this code is
 * pretty fragile.
 */

const knownMessages = [
  {match: /cannot find from_points: [0-9]+/i,                        msg: 'cannot find start location'},
  {match: /cannot find to_points: [0-9]+/i,                          msg: 'cannot find end location'},
  {match: /connection between locations not found: [0-9]+->[0-9]+/i, msg: 'cannot find route between locations'}
]

function knownError(err) {
  let msg
  if (err.name === 'StatusCodeError') {
    let error = err.error
    if (error && (error.message === 'Bad Request')) {
      let hint = error.hints && error.hints[0]
      if (hint) {
        let message = hint.message
        if (message) {
          let match = knownMessages.find(m => m.match.test(message))
          if (match) msg = match.msg
        }
      }
    }
  }
  return msg
}


/*
 * The variation of the GeoJSON Feature object imlemented here has these
 * properties:
 * *   `uid` (string) - unique identifier (always present)
 * *   `properties` (Object)
 * *   `geometry` (Object)
 */

class Geocoding extends HasModels {

  constructor() {
    super({modelNames: {
      'distance_cache': 'DistanceCache',
      'feature_cache': 'FeatureCache' }})

    users.protectedRoute(this.config.routePrefix+'/*', true)

    router.route(this.config.routePrefix+'/geocode', ::this._geocodeService)
    router.route(this.config.routePrefix+'/location', ::this._locationService)
    router.route(this.config.routePrefix+'/distance', ::this._distanceService)

  }

  _userConfig() {
    return {
      routePrefix: '/geocode',
      geocodeURL: '',
      locationURL: '',
      matrixURL: '',
      geocodeKey: ''
    }
  }

  /** Geocodes an address.
   *
   * These geocoding options are recognized:
   * *   `location` - a GeoJSON Feature object with OSM properties;
   *       provides a bias for results closer to the location
   *
   * @param {string} address - address string
   * @param {Object} opts - geocoding options
   * @return {Array} array of matching GeoJSON Feature objects
   */
  async geocodeAddress(address, opts={}) {
    let [uri, params] = splitURL(app.config.geocoding.geocodeURL),
        qs = Object.assign(params, {key: app.config.geocoding.geocodeKey, q: address})
    if (opts.location) {
      let point = opts.location.properties && opts.location.properties.point
      if (point) qs.point = `${point.lat},${point.lng}`
    }
    let options = {
          uri,
          qs,
          // headers: { 'User-Agent': 'Request-Promise' },
          json: true // Automatically parses the JSON string in the response
        },
        features
    try {
      let response = await request(options)
      features = response.hits.map(properties => this._featureFromProperties(properties) )
    }
    catch (e) {
      this.log.error("geocode service", e)
      features = []
    }
    await this._updateCache(features)
    features.forEach(feature => { this._mungeOSMProperties(feature) })
    return features
  }

  /** Finds cached GeoJSON Feature object.
   * @param {Object|string} id - either a uid string or a Feature
   *   properties object (which should contain an `osm_id` property)
   * @return {Object} GeoJSON Feature object
   */
  async findFeature(id) {
    let uid = (typeof id === 'object') ? this._uidFromProperties(id) : id
    if (uid) {
      let feature = await this.models.FeatureCache.findOne({uid})
      if (feature) {
        this._mungeOSMProperties(feature)
        feature = pick(feature, ['properties', 'geometry'])
        feature.type = 'Feature'
        return feature
      }
    }
  }

  /** Finds distance from one location to another.
   * @param {Object} fromFeature - GeoJSON Feature object for start location
   * @param {Object} toFeature - GeoJSON Feature object for end location
   * @return {Promise} resolves to distance in meters
   */
  async findDistance(fromFeature, toFeature) {

    const pickUid = (feature) => {
      let uid = feature.uid
      if (!uid && feature.properties) uid = this._uidFromProperties(feature.properties)
          // TO DO fix me -- should always have uid defined (fix project creation)
      return uid
    }
    const pickPoint = (feature) => {
      let point = feature.properties && feature.properties.point
      return point && `${point.lat},${point.lng}`
    }
    const formatPoint = (feature) => {
      let point = feature.properties && feature.properties.point
      return point && `(lat: ${point.lat}, lng: ${point.lng})`
    }

    let fromUid = pickUid(fromFeature),
        toUid = pickUid(toFeature),
        distance
    if (fromUid && toUid) {
      distance = await this.models.DistanceCache.findOne({fromUid, toUid})
      if (!distance) {
        let fromPoint = pickPoint(fromFeature),
            toPoint = pickPoint(toFeature)
        if (fromPoint && toPoint) {
          let [uri, params] = splitURL(app.config.geocoding.matrixURL),
              options = {
                uri,
                qs: Object.assign(params, {
                  key: app.config.geocoding.matrixKey,
                  from_point: fromPoint,
                  to_point: toPoint,
                  out_array: 'distances' }),
                json: true // Automatically parses the JSON string in the response
              }
          try {
            let response = await request(options),
                dist = response.distances && response.distances[0][0]
            if (dist) {
              distance = await this.models.DistanceCache.createOrUpdate({fromUid, toUid}, {fromUid, toUid, distance: dist})
            }
          }
          catch (e) {
            let msg = knownError(e)
            if (!msg)
              this.log.error(`findDistance ${formatPoint(fromFeature)} -> ${formatPoint(toFeature)}`, e)
            else {
              this.log.info(`findDistance ${formatPoint(fromFeature)} -> ${formatPoint(toFeature)}, ${msg}`)
              distance = await this.models.DistanceCache.createOrUpdate({fromUid, toUid}, {fromUid, toUid, distance: undefined})
            }
          }
        }
      }
    }
    return distance && distance.distance
  }

  async _geocodeService(req, res) {
    let features = await this.geocodeAddress(req.query.term)
    features = features.filter((feature) => true) // TO DO figure out filter
    res.json({features})
  }

  async _locationService(req, res) {
    let uid = req.query.uid,
        feature = await this.models.FeatureCache.findOne({uid})
    if (feature && feature.geometry)
      this.log.debug('location service: feature cached, has geometry')
    else {
      if (feature) this.log.debug('location service: feature cached, no geometry')
      if (uid.startsWith('osm:')) {
        let [uri, params] = splitURL(app.config.geocoding.locationURL),
            options = {
              uri,
              qs: Object.assign(params, {id: uid.substring(4)}),
              json: true // Automatically parses the JSON string in the response
            }
        try {
          let response = await request(options),
              geometry = (response.geometries && response.geometries[0]) ||
                this._geometryFromProperties(feature.properties)
          if (geometry) {
            feature = await this.models.FeatureCache.createOrUpdate({uid}, {uid, geometry})
          }
        }
        catch (e) {
          this.log.error("location service", e)
        }
      }
      if (!feature) feature = {uid}
    }
    feature.type = "Feature"
    this._mungeOSMProperties(feature)
    res.json({feature})
  }

  _distanceService(req, res) {
  }

  _uidFromProperties(properties) {
    return properties.osm_id ? `osm:${properties.osm_id}` : ''
  }

  _geometryFromProperties(properties) {
    if (properties.point)
      return {type: 'Point', coordinates: [properties.point.lng, properties.point.lat]}
  }
  _featureFromProperties(properties) {
    let feature = {type: 'Feature', uid: this._uidFromProperties(properties), properties}
    if (properties.osm_type && (properties.osm_type === 'N')) {
      let geometry = this._geometryFromProperties(properties)
      if (geometry) feature.geometry = geometry
    }
    return feature
  }

  /*
   * This replaces existing properties when updating existing cache
   * entries. Alternatively, it could just fill in missing attributes,
   * but "most recent is best" seems the better strategy.
   */
  async _updateCache(features) {
    try {
      await Promise.all(features.map((feature) => {
        let values = pick(feature, ['uid', 'properties', 'geometry'])
        return this.models.FeatureCache.createOrUpdate({uid: feature.uid}, values)
      }))
    }
    catch (e) {
      this.log.error("location cache update", e)
    }
  }


  /* Normalizes OSM feature properties.
   *
   * The OSM `name` property seems to duplicate information from other
   * properties (such as state and country). However, it's not entirely
   * redundant (it seems to specify county names, for example). We make
   * an attempt here to remove the duplicate information.
   *
   * The OSM `state` property seems to be a mix of full names and
   * abbreviations. We prefer the full name.
   */
  _mungeOSMProperties(feature) {
    let parts

    function omitMatches(str) {
      str = str.toLowerCase()
      for (let i = parts.length - 1; i >= 0; i -= 1)
        if (parts[i].toLowerCase() === str) parts.splice(i, 1)
    }

    if (feature.uid && feature.uid.startsWith('osm:')) {
      let properties = feature.properties
      if (properties) {
        if (properties.country) {
          // prefer canonical country name
          let str = properties.country.toLowerCase()
          if (countryJunk[str])
            properties.country = countryJunk[str]
        }
        if ((properties.country === usaDefault) && properties.state) {
          // prefer full state name
          let str = properties.state.toLowerCase()
          if (usaStateSynonyms[str])
            properties.state = usaStateSynonyms[str]
        }
        if (properties.name) {
          // remove duplicate information from name
          parts = properties.name.split(',').map(part => part.trim()).filter(part => part)
          if (properties.street) omitMatches(properties.street)
          if (properties.city) omitMatches(properties.city)
          if (properties.state) {
            let str = properties.state.toLowerCase()
            omitMatches(str)
            if ((properties.country === usaDefault) && usaStateAbbreviations[str])
              omitMatches(usaStateAbbreviations[str])
          }
          if (properties.postcode) {
            omitMatches(properties.postcode)
            if ((properties.country === usaDefault) && properties.state) {
              let str = properties.state.toLowerCase()
              str = (usaStateAbbreviations[str] || str) + ' ' + properties.postcode
              omitMatches(str)
            }
          }
          if (properties.country) {
            let str = properties.country.toLowerCase()
            omitMatches(str)
            if (countryAbbreviations[str])
              omitMatches(countryAbbreviations[str])
          }
          if (parts.length === 0)
            delete properties.name
          else
            properties.name = parts.join(', ')
        }
      }
    }
    return feature
  }

}

const geocoding = Geocoding.getProxy()
export {Geocoding as default, geocoding}
