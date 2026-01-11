import { Injectable } from '@nestjs/common';
import { createHmac, createHash } from 'crypto';

@Injectable()
export class GrouponSignatureService {
  generateSignature(
    method: string,
    url: string,
    body: string,
    nonce: string,
    apiKey: string,
  ): string {
    const trimmedBody = (body ?? '').trim();
    const bodyHash = this.sha256Hex(trimmedBody);

    const { baseUrl, encodedQuery } = this.parseUrl(url);
    const encodedParts = [
      this.percentEncode(method.toUpperCase()),
      this.percentEncode(nonce),
      this.percentEncode(baseUrl),
      encodedQuery,
      bodyHash,
    ].join('&');

    const hmac = createHmac('sha1', apiKey);
    hmac.update(encodedParts);
    const signature = hmac.digest('base64');
    return this.percentEncode(signature);
  }

  private parseUrl(url: string): { baseUrl: string; encodedQuery: string } {
    const uri = new URL(url);
    const baseUrl = `${uri.protocol}//${uri.host}${uri.pathname}`;

    const sortedParams = Array.from(uri.searchParams.entries()).sort((a, b) => {
      const left = `${a[0]}=${a[1]}`;
      const right = `${b[0]}=${b[1]}`;
      return left < right ? -1 : left > right ? 1 : 0;
    });
    const encodedPairs = sortedParams.map(
      ([k, v]) => `${this.percentEncode(k)}=${this.percentEncode(v)}`,
    );
    const joined = encodedPairs.join('&');
    const encodedQuery = this.percentEncode(joined);
    return { baseUrl, encodedQuery };
  }

  private sha256Hex(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  private percentEncode(input: string): string {
    return encodeURIComponent(input)
      .replace(/\+/g, '%20')
      .replace(/\*/g, '%2A')
      .replace(/%7E/g, '~');
  }
}
