import { authedRequest } from '@/modules/auth/api/authApi';

export type CloudinaryResourceType = 'image' | 'video' | 'raw';
export type CloudinaryFolder = 'products' | 'catalogues' | 'orders' | 'settings';

type UploadSignature = {
    cloudName: string;
    resourceType: CloudinaryResourceType;
    maxUploadBytes: number;
    api_key: string;
    signature: string;
    folder: string;
    timestamp: number;
};

type CloudinaryResponse = {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
};

/** Upload a file directly to Cloudinary using a short-lived API signature. */
export async function uploadMediaFile(
    file: File,
    resourceType: CloudinaryResourceType,
    folder: CloudinaryFolder,
): Promise<string> {
    return uploadMediaSource(file, resourceType, folder);
}

/** Re-host an existing direct media URL in this Cloudinary account. */
export async function uploadMediaUrl(
    source: string,
    resourceType: CloudinaryResourceType,
    folder: CloudinaryFolder,
): Promise<string> {
    const url = source.trim();
    if (!/^https:\/\//i.test(url)) throw new Error('Use a full HTTPS media URL');
    return uploadMediaSource(url, resourceType, folder);
}

async function uploadMediaSource(
    source: File | string,
    resourceType: CloudinaryResourceType,
    folder: CloudinaryFolder,
): Promise<string> {
    const signature = await authedRequest<UploadSignature>(
        `/admin/uploads/signature?resourceType=${resourceType}&folder=${folder}`,
    );
    if (typeof source === 'string' && source.startsWith(`https://res.cloudinary.com/${signature.cloudName}/`)) {
        return source;
    }
    if (source instanceof File && source.size > signature.maxUploadBytes) {
        throw new Error(`Keep the file under ${Math.floor(signature.maxUploadBytes / (1024 * 1024))} MB`);
    }

    const body = new FormData();
    body.append('file', source);
    body.append('api_key', signature.api_key);
    body.append('timestamp', String(signature.timestamp));
    body.append('signature', signature.signature);
    body.append('folder', signature.folder);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/${resourceType}/upload`,
        { method: 'POST', body },
    );
    const result = (await response.json().catch(() => null)) as CloudinaryResponse | null;
    if (!response.ok || !result?.secure_url) {
        throw new Error(result?.error?.message || 'Cloudinary could not upload this file');
    }
    return result.secure_url;
}
