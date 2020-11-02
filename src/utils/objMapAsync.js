export default function objMapAsync(object, callback) {
  return Promise.all(
    Object.entries(object).map(([key, value]) => {
      return Promise.resolve(callback(value)).then(result => [key, result]);
    })
  ).then(results =>
    results.reduce((accumulator, [key, result]) => {
      accumulator[key] = result;
      return accumulator;
    }, {})
  );
}
