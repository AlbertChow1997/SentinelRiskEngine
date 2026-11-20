function handler(event) {
  var request = event.request;
  // Attached only to the S3 behaviour: never turn API errors into HTML/200.
  if (request.uri.endsWith('/') || !request.uri.split('/').pop().includes('.')) {
    request.uri = '/index.html';
  }
  return request;
}
