import { AuthChain, EthAddress } from '@dcl/schemas'
import { Authenticator } from '@dcl/crypto'

export function getOwnerAddressFromAuthChain(authChain: AuthChain): string {
  return Authenticator.ownerAddress(authChain)
}

export function isValidOwnerAddress(ownerAddress: EthAddress): boolean {
  return !!ownerAddress && EthAddress.validate(ownerAddress)
}
