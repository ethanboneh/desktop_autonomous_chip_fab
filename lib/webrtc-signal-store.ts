export interface SignalStore {
  broadcasterOffer: RTCSessionDescriptionInit | null;
  viewerAnswer: RTCSessionDescriptionInit | null;
  broadcasterCandidates: RTCIceCandidateInit[];
  viewerCandidates: RTCIceCandidateInit[];
}

const store: SignalStore = {
  broadcasterOffer: null,
  viewerAnswer: null,
  broadcasterCandidates: [],
  viewerCandidates: [],
};

export function getStore(): SignalStore {
  return store;
}

export function resetStore(): void {
  store.broadcasterOffer = null;
  store.viewerAnswer = null;
  store.broadcasterCandidates = [];
  store.viewerCandidates = [];
}
