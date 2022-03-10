const { Client, AccountId, PrivateKey, Hbar } = require('@hashgraph/sdk')
const { HcsIdentityNetworkBuilder, DidMethodOperation } = require('@hashgraph/did-sdk-js')

require('dotenv').config()

async function main () {
  console.log(process.env.HCLI_MIRROR_PROVIDER)

  const client = Client
    .forName(process.env.HCLI_NETWORK)
    .setOperator(AccountId.fromString(process.env.HCLI_PAYER), PrivateKey.fromString(process.env.HCLI_PAYERPRIVKEY))
    .setMirrorNetwork(process.env.HCLI_MIRROR_PROVIDER)

  const identityNetwork = await new HcsIdentityNetworkBuilder()
    .setNetwork(process.env.HCLI_NETWORK)
    .setAppnetName('MyIdentityAppnet')
    .addAppnetDidServer('https://appnet-did-server-url:port/path-to-did-api')
    .setPublicKey(PrivateKey.fromString(process.env.HCLI_PAYERPRIVKEY).publicKey)
    .setMaxTransactionFee(new Hbar(2))
    .setDidTopicMemo('MyIdentityAppnet DID topic')
    .setVCTopicMemo('MyIdentityAppnet VC topic')
    .execute(client)

  console.log(identityNetwork)

  const did = identityNetwork.generateDid(true)

  console.log(did)

  const didRootKey = did.getPrivateDidRootKey()

  console.log(didRootKey)

  const didDocument = did.generateDidDocument()

  console.log(didDocument)

  await identityNetwork.createDidTransaction(DidMethodOperation.CREATE)
    .setDidDocument(JSON.stringify(didDocument))
    .signMessage(doc => didRootKey.sign(doc))
    .buildAndSignTransaction(tx => tx.setMaxTransactionFee(new Hbar(2)))
    .onMessageConfirmed(msg => {
      console.log(msg)
    })
    .execute(client)
}

main()
