import Geocoding from '../'

let geocoding

beforeAll(() => {
  geocoding = new Geocoding()
})

describe('Sanity', () => {
  it('has expected properties', async () => {
    expect(geocoding).toHaveProperty('geocodeAddress')
    expect(geocoding).toHaveProperty('findDistance')
    expect(geocoding).toHaveProperty('findFeature')
  })
})

