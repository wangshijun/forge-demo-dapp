/* eslint-disable no-console */
const multibase = require('multibase');
const ForgeSDK = require('@arcblock/forge-sdk');
const auth = require('../../libs/auth');

module.exports = {
  action: 'lucky',
  claims: {
    signature: async ({ userAddress, userPkHex, extraParams: { locale } }) => {
      const amounts = [8.88, 88.88, 0.88, 0.66, 6.66, 66.66];
      const amount = amounts[Math.ceil(Math.random() * 100) % amounts.length];
      const description = {
        en: `Sign this transaction to claim ${amount} reward`,
        zh: `签名该交易，领取 ${amount} 奖励`,
      };

      const wallet = ForgeSDK.Wallet.fromJSON(auth.wallet);

      const exchange = {
        pk: wallet.publicKey, // pk of application
        itx: {
          to: userAddress,
          sender: {
            value: ForgeSDK.Util.fromTokenToUnit(amount),
          },
          receiver: {
            value: ForgeSDK.Util.fromTokenToUnit(0),
          },
        },
      };

      const { buffer, object: encoded } = await ForgeSDK.encodeExchangeTx({
        tx: exchange,
        wallet,
      });
      const senderSignature = wallet.sign(buffer);
      console.log('lucky.onReq.signature', { exchange, signature: senderSignature, buffer });

      // We need to persist from and nonce
      exchange.from = encoded.from;
      exchange.nonce = encoded.nonce;

      // Attach sender signature and signatures for client
      exchange.signature = senderSignature;
      exchange.signatures = [
        {
          pk: userPkHex,
          signer: userAddress,
        },
      ];

      return {
        wallet,
        txType: 'ExchangeTx',
        txData: exchange,
        description: description[locale] || description.en,
      };
    },
  },

  onAuth: async ({ claims, userAddress }) => {
    const wallet = ForgeSDK.Wallet.fromJSON(auth.wallet);
    const claim = claims.find(x => x.type === 'signature');
    const tx = ForgeSDK.decodeTx(multibase.decode(claim.origin));
    console.log('lucky.onAuth.payload', { tx, claim });

    tx.signatures = tx.signaturesList;
    const userSig = tx.signatures.find(x => x.signer === userAddress);
    if (userSig) {
      userSig.signature = claim.sig;
    }
    console.log('lucky.onAuth.multisig', userSig);

    try {
      const hash = await ForgeSDK.sendExchangeTx({
        tx,
        wallet,
        // We do not touch signature here, since user sig is in signatures list now
        signature: tx.signature,
      });
      console.log('lucky.onAuth', hash);
      return { hash, tx: claim.origin };
    } catch (err) {
      console.error(err);
      if (Array.isArray(err.errors)) {
        throw new Error(err.errors.map(x => x.message).join(';'));
      }
    }
  },
};
