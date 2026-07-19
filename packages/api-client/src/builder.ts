export class RequestBuilder {
  private url: string = '';
  private method: string = 'GET';
  private headers: Record<string, string> = {};
  private data: any = null;

  setUrl(url: string) { this.url = url; return this; }
  setMethod(method: string) { this.method = method; return this; }
  setHeaders(headers: Record<string, string>) { this.headers = headers; return this; }
  setData(data: any) { this.data = data; return this; }

  build() {
    return {
      url: this.url,
      method: this.method,
      headers: this.headers,
      data: this.data,
    };
  }
}
