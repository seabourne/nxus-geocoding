import sinon from 'sinon'

let geocoding = application.get('geocoding')

async function createUser (email, password = 'test', admin=false) {
  let User = await storage.getModel('users-user')
  return User.findOrCreate({email}, {email, password, admin, enabled: true})
}

//mocked response so not really used but for ref
let testAddress = '206 Washington St SW, Atlanta, GA'
let uid = "osm:54032749"

let req

describe('Integration', () => {
  beforeAll(async () => {
    let email = 'test@example.com'
    let user = await createUser(email)
    req = await tester.requestLogin(email)
    req = req.defaults({resolveWithFullResponse: true, simple: false})
  })

  it("provide geocodes an address", async () => {
    let res = await geocoding.geocodeAddress(testAddress)
    expect(res).toHaveProperty('length', 3)
    checkFeature(res[0])
  })

  it("service geocodes an address", async () => {
    let res = await req.get({url:'/geocode/geocode?term='+testAddress, json: true})
    expect(res.statusCode).toEqual(200)
    expect(res.body).toHaveProperty('features.length', 3)
    checkFeature(res.body.features[0])
  })

  it("findFeature gets cached object", async () => {
    let feature = await geocoding.findFeature(uid)
    checkFeature(feature)
  })
  
})


function checkFeature(feature) {
    expect(feature).toHaveProperty('uid', uid)
    expect(feature).toHaveProperty('properties.city', 'Atlanta')
    expect(feature).toHaveProperty('properties.state', 'Georgia')
    expect(feature).toHaveProperty('properties.point.lat')
    expect(feature).toHaveProperty('properties.point.lat')
    expect(feature).toHaveProperty('properties.point.lng')
}
