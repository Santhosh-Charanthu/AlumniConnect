const promise = new Promise((resolve, reject) => {
  let success = true;
  if (success) {
    resolve("Event success");
  } else {
    reject("Event rejected");
  }
});

promise
  .then((message) => {
    console.log(message);
  })
  .catch((error) => {
    console.log(error);
  });
