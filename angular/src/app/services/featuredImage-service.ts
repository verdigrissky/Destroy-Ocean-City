import { Injectable } from '@angular/core';
import { post } from '../models/post-model';

const SIZED_VARIANTS = ['medium', 'medium_large', 'large'];
const DEFAULT_VARIANT = 'medium_large';

export interface SizedImage {
    src: string;
    srcset: string | null;
    width: number | null;
    height: number | null;
}

@Injectable({ providedIn: 'root' })
export class FeaturedImageService {
    private fallbackImages: string[] = [];

    constructor() {
        const fallbackCount = 7;
        for (let i=0; i< fallbackCount; i++) {
            this.fallbackImages.push(`/featuredImages/featured${i}.png`);
        }
    }

    image(post: post): string | null {
        return post._embedded?.['media']?.[0]?.source_url || null;

    }

    sized(post: post): SizedImage | null {
        const media = post._embedded?.['media']?.[0];
        if (!media?.source_url) return null;

        const sizes = media.media_details?.sizes ?? {};
        const variants = SIZED_VARIANTS
            .map(name => sizes[name])
            .filter(v => v?.source_url && v.width)
            .sort((a, b) => a.width - b.width)
            .filter((v, i, all) => i === 0 || v.width !== all[i - 1].width);
        if (!variants.length) {
            return { src: media.source_url, srcset: null, width: null, height: null };
        }

        const preferred = sizes[DEFAULT_VARIANT] ?? variants[variants.length - 1];
        return {
            src: preferred.source_url,
            srcset: variants.map(v => `${v.source_url} ${v.width}w`).join(', '),
            width: preferred.width,
            height: preferred.height,
        };

    }

    alt(post: post): string {
        return post._embedded?.['media']?.[0]?.alt_text || '';

    }

    randomFallback(): string {
        const index = Math.floor(Math.random() * this.fallbackImages.length);
        return this.fallbackImages[index];

    }

}
