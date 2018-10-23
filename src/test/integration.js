let geocoding = application.get('geocoding')

let url = '/task'

async function createUser (email, password = 'test', admin=false) {
  let User = await storage.getModel('users-user')
  return User.findOrCreate({email}, {email, password, admin, enabled: true})
}


let req
describe('Integration', () => {
  beforeAll(async () => {
    let email = 'test@example.com'
    let user = await createUser(email)
    req = await tester.requestLogin(email)
    req = req.defaults({resolveWithFullResponse: true, simple: false})
  })

  it("", () => {
    
  })
  
})
