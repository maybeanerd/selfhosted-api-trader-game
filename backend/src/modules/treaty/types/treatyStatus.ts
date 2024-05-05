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
}
