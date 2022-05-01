import * as https from 'https';
import * as fs from 'fs';

// TODO: use fetch() once nodejs has it natively

export default function httpsRequest({ baseUrl, url, body, uploadFile, ...options }) {
  return new Promise(async (ok, fail) => {
    const fullUrl = new URL(url, baseUrl).toString();
    const req = https.request(fullUrl, options, async response => {
      const chunks = [];
      response.on('data', data => chunks.push(data))
      await new Promise(ok => response.once('end', ok));
      const respText = Buffer.concat(chunks).toString();
      ok({
        status: response.statusCode,
        headers: response.headers,
        text: respText,
        json: respText[0] == '{' ? JSON.parse(respText) : null,
      });
    });
    req.on('error', fail);

    if (uploadFile) {
      const fileStream = fs.createReadStream(uploadFile);
      await new Promise((ok, fail) => {
        fileStream.once('open', ok);
        fileStream.once('error', fail);
      });
      fileStream.pipe(req);
    } else {
      if (body) req.write(body);
      req.end();
    }
  });
}
