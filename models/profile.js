import { defaultProfile, store } from "/store.js";
import { SYNC_PROFILE } from "/utils/sync.js";

function getProfileRef() {
  const { appId, userId } = ellx.auth() || {};

  return firebase.firestore()
    .collection('apps')
    .doc(appId)
    .collection('profiles')
    .where("owner", "==", userId);
}

export function connect() {
  const { appId, userId } = ellx.auth() || {};

  return getProfileRef()
    .onSnapshot(
      querySnapshot => querySnapshot.empty
        ? updateProfile({ ...defaultProfile, owner: userId })
        : store.commit(SYNC_PROFILE, querySnapshot)
  );
}

export function updateProfile(data, options = {}) {
  const { appId, userId } = ellx.auth() || {};

  return firebase.firestore()
    .collection('apps')
    .doc(appId)
    .collection('profiles')
    .doc(userId)
    .set(data, options);
}
