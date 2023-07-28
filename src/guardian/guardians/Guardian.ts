import { Field, PublicKey, Poseidon, Struct, Bool } from 'snarkyjs';

export class Guardian extends Struct({
  publicKey: PublicKey,
  nullifierMessage: Field,
  isVoted: Bool,
}) {
  /**
   * @notice Create a guardian with props
   * @param publicKey public key of the guardian
   * @param nullifierMessage nullifier message of the guardian
   * @returns Guardian a guardian object
   */
  static from(publicKey: PublicKey, nullifierMessage: Field) {
    return new Guardian({
      publicKey,
      nullifierMessage,
      isVoted: Bool(false),
    });
  }

  /**
   * @notice Create an empty guardian
   * @returns Guardian, an empty guardian object
   */
  static empty() {
    return Guardian.from(PublicKey.empty(), Field(0));
  }

  /**
   * @returns hash of the Guardian
   */
  hash(): Field {
    return Poseidon.hash(
      this.publicKey
        .toFields()
        .concat(this.nullifierMessage.toFields())
        .concat(this.isVoted.toFields())
    );
  }

  /**
   * @notice Set the nullifier message of the guardian
   * @param newNullifierMessage: Field, a new nullifier message of the guardian
   * @returns Guardian, a guardian object with updated nullifier message
   */
  setNullifierMessage(newNullifierMessage: Field) {
    return new Guardian({
      publicKey: this.publicKey,
      nullifierMessage: newNullifierMessage,
      isVoted: this.isVoted,
    });
  }

  /**
   * @notice Set the isVoted of the guardian
   * @returns Guardian, a guardian object with updated isVoted
   */
  vote(): Guardian {
    return new Guardian({
      publicKey: this.publicKey,
      nullifierMessage: this.nullifierMessage,
      isVoted: Bool(true),
    });
  }
}
