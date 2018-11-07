import sinon from 'sinon'

import Geocoding from '../'
import {router} from 'nxus-router'
import {application} from 'nxus-core'

let geocoding

beforeAll(() => {
  application.config.geocoding = {'routePrefix': '/test/geocode'}
  sinon.spy(router, 'provide')
  geocoding = new Geocoding()
})

describe('Sanity', () => {
  it('has expected properties', async () => {
    expect(geocoding).toHaveProperty('geocodeAddress')
    expect(geocoding).toHaveProperty('findDistance')
    expect(geocoding).toHaveProperty('findFeature')
  })

  it('registers routes using config routePrefix', () => {
    expect(router.provide.calledWith('route', '/test/geocode/geocode')).toBeTruthy()
    expect(router.provide.calledWith('route', '/test/geocode/location')).toBeTruthy()
    expect(router.provide.calledWith('route', '/test/geocode/distance')).toBeTruthy()
  })
})

