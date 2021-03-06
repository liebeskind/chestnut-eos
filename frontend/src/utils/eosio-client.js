import React from "react";
// import { initAccessContext } from "wal-eos";
// import scatter from "wal-eos-scatter-provider";
import { Api, JsonRpc, JsSignatureProvider } from "eosjs";
import ScatterJS from "scatterjs-core";
import ScatterEOS from "scatterjs-plugin-eosjs2"; // Use eosjs2 if your version of eosjs is > 16

// const endpoint = "http://jungle2.cryptolions.io:80"; // Jungle
const endpoint = "https://jungle2.cryptolions.io:443"; // Jungle2
// const endpoint = "https://junglehistory.cryptolions.io:443"; // Jungle2 full node

// Networks are used to reference certain blockchains.
// They let you get accounts and help you build signature providers.
const network = ScatterJS.Network.fromJson({
	blockchain: "eos",
	// protocol: "http",
	protocol: "https",
	// host: "dev.cryptolions.io",
	// host: "api.jungle.alohaeos.com",
	host: "jungle2.cryptolions.io",
	port: 443,
	// port: 80,
	// chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906" // EOS Main Net
	chainId: "e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473" // Jungle2
	// chainId: "038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca" //Jungle1
});

class EOSIOClient extends React.Component {
	constructor(contractAccount) {
		super(contractAccount);
		this.contractAccount = contractAccount;
		this.account;
		this.eos;
		this.scatter;

		// Don't forget to tell ScatterJS which plugins you are using.
		ScatterJS.plugins(new ScatterEOS());

		// Can implement this into Redux using dispatch(setScatter(ScatterJS.scatter));
		try {
			ScatterJS.scatter.connect(this.contractAccount).then(connected => {
				// User does not have Scatter Desktop, Mobile or Classic installed.
				if (!connected) return console.log("Issue Connecting");

				const scatter = ScatterJS.scatter;
				this.scatter = scatter;

				this.requiredFields = {
					accounts: [network]
				};

				this.rpc = new JsonRpc(endpoint);
				// // this.login();
				// scatter.getIdentity(this.requiredFields).then(() => {
				// 	// Always use the accounts you got back from Scatter. Never hardcode them even if you are prompting
				// 	// the user for their account name beforehand. They could still give you a different account.
				// 	this.account = scatter.identity.accounts.find(
				// 		x => x.blockchain === "eos"
				// 	);

				// 	// Get a proxy reference to eosjs which you can use to sign transactions with a user's Scatter.
				// 	const rpc = new JsonRpc(endpoint);
				// 	this.eos = scatter.eos(network, Api, { rpc });
				// });

				this.eos = this.scatter.eos(network, Api, { rpc: this.rpc });
				window.ScatterJS = null;
			});
		} catch (error) {
			console.log(error);
		}
	}

	login = async cb => {
		await this.scatter.suggestNetwork(network);
		await this.scatter.getIdentity(this.requiredFields);
		// Always use the accounts you got back from Scatter. Never hardcode them even if you are prompting
		// the user for their account name beforehand. They could still give you a different account.
		this.account = await this.scatter.identity.accounts.find(
			x => x.blockchain === "eos"
		);

		// Get a proxy reference to eosjs which you can use to sign transactions with a user's Scatter.
		this.eos = this.scatter.eos(network, Api, { rpc: this.rpc });
		return cb(this.account);

		window.ScatterJS = null;
	};

	chestnutTransaction = (action, data) => {
		return this.eos.transact(
			{
				actions: [
					{
						account: this.account.name,
						name: action,
						authorization: [
							{
								actor: this.account.name,
								permission: this.account.authority
							}
						],
						data: {
							...data
						}
					}
				]
			},
			{
				blocksBehind: 3,
				expireSeconds: 30
			}
		);
	};

	// tokenTransfer = async data => {
	// 	console.log(this.account)
	// 	const result = await this.eos.transact(
	// 		{
	// 			actions: [
	// 				{
	// 					account: "eosio.token",
	// 					name: "transfer",
	// 					authorization: [
	// 						{
	// 							actor: this.account.name,
	// 							permission: this.account.authority
	// 						}
	// 					]
	// 				}
	// 			]
	// 		},
	// 		{
	// 			blocksBehind: 3,
	// 			expireSeconds: 30
	// 		}
	// 	);
	// 	return result;
	// };

	makeSmartAccount = async () => {
		console.log(this.account);
		const { name, publicKey } = this.account;
		const permission = this.account.authority;
		console.log(name, publicKey, permission);
		const result = await this.eos.transact(
			{
				actions: [
					// Create @chestnut permission for account
					{
						account: "eosio",
						name: "updateauth",
						authorization: [
							{
								actor: name,
								permission: permission
							}
						],
						data: {
							account: name,
							permission: "chestnut",
							parent: "owner",
							auth: {
								threshold: 1,
								keys: [
									{
										key: publicKey,
										weight: 1
									}
								],
								accounts: [],
								waits: []
							}
						}
					},
					// Create the multisig active permission with `chestnutmsig@security` and `account@chestnut`
					{
						account: "eosio",
						name: "updateauth",
						authorization: [
							{
								actor: name,
								permission: permission
							}
						],
						data: {
							account: name,
							permission: "active",
							parent: "owner",
							auth: {
								threshold: 2,
								keys: [],
								accounts: [
									{
										permission: {
											actor: "chestnutmsig",
											permission: "security"
										},
										weight: 1
									},
									{
										permission: {
											actor: name,
											permission: "chestnut"
										},
										weight: 1
									}
								],
								waits: []
							}
						}
					},
					// # linkauth of the @chestnut permisssion to `eosio.msig`
					{
						account: "eosio",
						name: "linkauth",
						authorization: [
							{
								actor: name,
								permission: permission
							}
						],
						data: {
							account: name,
							code: "eosio.msig",
							type: "propose",
							requirement: "chestnut"
						}
					},
					// # linkauth of the @chestnut permission to `eosio.msig` part 2
					{
						account: "eosio",
						name: "linkauth",
						authorization: [
							{
								actor: name,
								permission: permission
							}
						],
						data: {
							account: name,
							code: "eosio.msig",
							type: "approve",
							requirement: "chestnut"
						}
					},
					// # linkauth of the @chestnut permission to the actions on our smart contract
					{
						account: "eosio",
						name: "linkauth",
						authorization: [
							{
								actor: name,
								permission: permission
							}
						],
						data: {
							account: name,
							code: "chestnutmsig",
							type: "",
							requirement: "chestnut"
						}
					},
					// # update @owner permission with no trusted recovery with friends
					{
						account: "eosio",
						name: "updateauth",
						authorization: [
							{
								actor: name,
								permission: permission
							}
						],
						data: {
							account: name,
							permission: "owner",
							parent: "",
							auth: {
								threshold: 2,
								keys: [],
								accounts: [
									{
										permission: {
											actor: "chestnutmsig",
											permission: "security"
										},
										weight: 1
									},
									{
										permission: {
											actor: name,
											permission: "chestnut"
										},
										weight: 1
									}
								],
								waits: []
							}
						}
					}
				]
			},
			{
				blocksBehind: 3,
				expireSeconds: 30,
				broadcast: true
			}
		);
		return result;
	};

	// makeSmartAccount = async () => {
	// 	const result = await this.eos.transact(
	// 		{
	// 			actions: [
	// 			// Create @chestnut permission for account
	// 				{
	// 					account: this.account.name,
	// 					name: 'updateauth',
	// 					authorization: [
	// 						{
	// 							actor: this.account.name,
	// 							permission: 'owner'
	// 						}
	// 					],
	// 					data: {
	// 					    account: this.account.name,
	// 					    permission: "chestnut",
	// 					    parent: "owner",
	// 					    auth: {
	// 					        threshold: 1,
	// 					        keys: [
	// 					            {
	// 					                key: this.account.publicKey,
	// 					                weight: 1
	// 					            }
	// 					        ],
	// 					        accounts: [],
	// 					        waits: []
	// 					    }
	// 					}
	// 				},
	// 				// Create the multisig active permission with `chestnutmsig@security` and `account@chestnut`
	// 				{
	// 					account: this.account.name,
	// 					name: 'updateauth',
	// 					authorization: [
	// 						{
	// 							actor: this.account.name,
	// 							permission: 'owner'
	// 						}
	// 					],
	// 					data: {
	// 					    account: this.account.name,
	// 					    permission: "active",
	// 					    parent: "owner",
	// 					    auth: {
	// 					        threshold: 2,
	// 					        keys: [
	// 					            {
	// 					                key: this.account.publicKey,
	// 					                weight: 1
	// 					            }
	// 					        ],
	// 					        accounts: [
	// 						        {permission:{actor:"chestnutmsig",permission:"security"},weight:1},
	// 						        {permission:{actor:this.account.name,permission:"chestnut"},weight:1}
	// 					        ],
	// 					        waits: []
	// 					    }
	// 					}
	// 				},
	// 			]
	// 		},
	// 		{
	// 			blocksBehind: 3,
	// 			expireSeconds: 30
	// 		}
	// 	);
	// 	return result;
	// };

	getTable = async data => {
		console.log(this.eos);
		const result = await this.eos.getTableRows(data);

		console.log(result);

		return result;
	};
}

export default EOSIOClient;
