import { CatalystDeploymentEvent, EntityType, EthAddress, Events } from '@dcl/schemas'

export function createCatalystDeploymentProfileEvent(
  wearables: string[],
  userAddress: EthAddress
): CatalystDeploymentEvent {
  return {
    type: Events.Type.CATALYST_DEPLOYMENT,
    subType: Events.SubType.CatalystDeployment.PROFILE,
    key: 'bafkreicamuc6ecbu6a3jzew2g6bkiu4m7zclfm6wy5js4mlnyo6pljsveu',
    timestamp: 1708380838534,
    entity: {
      version: 'v3',
      id: 'bafkreid7ohlfwnary6k73rp7x7xa5uum53p6qchmxlcf3nbvkw5inss5li',
      type: EntityType.PROFILE,
      pointers: [userAddress],
      timestamp: 1708380838534,
      content: [],
      metadata: {
        avatars: [
          {
            hasClaimedName: false,
            description: 'A second description',
            tutorialStep: 256,
            name: 'PaleAleTest',
            avatar: {
              bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
              wearables
            },
            ethAddress: userAddress,
            version: 36,
            userId: userAddress,
            hasConnectedWeb3: true
          }
        ]
      }
    }
  }
}
