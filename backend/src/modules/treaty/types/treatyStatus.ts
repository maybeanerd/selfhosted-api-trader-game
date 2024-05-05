export enum TreatyStatus {
  /**
   * We requested a treaty
   */
  Requested = 'requested',
  /**
   * Others proposed a treaty
   */
  Proposed = 'proposed',
  /**
   * Both parties agreed to the treaty.
   */
  Signed = 'signed',
  /**
   * The treaty was rejected (by the other party).
   */
  Rejected = 'rejected',
  /**
   * The treaty was removed. We do not delete it entirely in the case that we want to start it anew.
   * This way we internally know the other party still offers a treaty.
   */
  Removed = 'removed',
}
