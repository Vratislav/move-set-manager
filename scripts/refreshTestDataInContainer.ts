import { refreshTestDataInContainer } from '../src/main/moveManagerLib/testUtils'

refreshTestDataInContainer()
  .then(() => {
    console.log('Test data refreshed in container')
  })
  .catch((err) => {
    console.error('Error refreshing test data in container', err)
  })
