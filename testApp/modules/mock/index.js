import {NxusModule} from 'nxus-core'
import {router} from 'nxus-router'

import {geocoding} from '../geocoding'

export default class Mock extends NxusModule {
  constructor() {
    super()

    router.route('/mock/geo', ::this.geocode)
  }

  geocode(req, res) {
    let result = {
      hits: 
[ { point: { lat: 33.7497468, lng: -84.3885702 },
    extent: [ -84.3886202, 33.7496968, -84.3885202, 33.7497968 ],
    name: '206 Washington Street Southwest, Atlanta, GA 30334, United States of America',
    country: 'USA',
    city: 'Atlanta',
    state: 'Georgia',
    street: 'Washington Street Southwest',
    postcode: '30334',
    osm_id: 54032749,
    osm_type: 'W',
    house_number: '206',
    osm_value: 'building' },
  { point: { lat: 33.749821, lng: -84.388511 },
    name: 'Washington St SW, Atlanta, GA, United States of America',
    country: 'United States of America',
    city: 'Atlanta',
    state: 'GA',
    street: 'Washington St SW',
    osm_id: -1,
    osm_type: 'N',
    osm_value: 'road' },
  { point: { lat: 33.749, lng: -84.38798 },
    extent: [ -84.551068, 33.647808, -84.28956, 33.886823 ],
    name: 'Atlanta, GA, United States of America',
    country: 'United States of America',
    city: 'Atlanta',
    state: 'Georgia',
    osm_id: -1,
    osm_type: 'N',
    osm_value: 'city' } ],
      took: 17
    }
    res.json(result)
  }
  
}
