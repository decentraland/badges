import { BadgeStorageComponents, createBadgeStorage } from '@badges/common'

export async function createBadgeStorageMock({ config, ...components }: Partial<BadgeStorageComponents> = {}) {
  return createBadgeStorage({
    config: { requireString: jest.fn().mockResolvedValue('https://any-url.tld'), ...config } as any,
    ...components
  })
}
