function updateToFirebase (ref, json) {
  return new Promise(function (resolve) {
    ref.update(json).then(resolve);
  });
};

function setToFirebase (ref, json) {
  return new Promise(function (resolve) {
    ref.set(json).then(resolve);
  })
};

function queryFromFirebase (ref) {
  return new Promise(function (resolve) {
    ref.once('value').then(function (snapshot) {
      resolve(snapshot.val());
    });
  })
};

function removeFromFirebase (ref) {
  return new Promise(function (resolve) {
    ref.remove().then(function () {
      resolve();
    });
  });
};

module.exports = {
  update: updateToFirebase,
  set: setToFirebase,
  query: queryFromFirebase,
  remove: removeFromFirebase
};