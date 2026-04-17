/**
 * Pinata IPFS client for uploading encrypted skill files.
 * Uses the new Pinata SDK (pinata package).
 */

import { PinataSDK } from 'pinata';

function getPinataClient() {
  const jwt = process.env.PINATA_JWT;
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'gateway.pinata.cloud';

  if (!jwt) {
    throw new Error('PINATA_JWT env variable not set');
  }

  return new PinataSDK({ pinataJwt: jwt, pinataGateway: gateway });
}

/**
 * Upload encrypted skill content to IPFS via Pinata.
 * Returns the IPFS CID.
 */
export async function uploadSkillToIPFS(
  skillId: string,
  encryptedContent: string,
  metadata: {
    name: string;
    type: string;
    version: string;
    seller: string;
  }
): Promise<string> {
  const pinata = getPinataClient();

  // Create a JSON file to upload (encrypted content + public metadata)
  const payload = {
    cortex_skill: true,
    skill_id: skillId,
    encrypted_source: encryptedContent, // AES-256-GCM encrypted
    public_metadata: {
      name: metadata.name,
      type: metadata.type,
      version: metadata.version,
      seller: metadata.seller,
    },
  };

  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const file = new File([blob], `skill_${skillId}.json`, { type: 'application/json' });

  const result = await pinata.upload.public.file(file);

  return result.cid;
}

/**
 * Fetch encrypted skill content from IPFS via Pinata gateway.
 * Returns the encrypted source string.
 */
export async function fetchSkillFromIPFS(cid: string): Promise<string> {
  const pinata = getPinataClient();
  const result = await pinata.gateways.public.get(cid);
  const data = result.data as unknown as { encrypted_source: string };
  return data.encrypted_source;
}

/**
 * For client-side: build the public gateway URL for a CID.
 */
export function getIPFSGatewayUrl(cid: string): string {
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'gateway.pinata.cloud';
  return `https://${gateway}/ipfs/${cid}`;
}
