export const IGatewayZEVM_ABI = [
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "receiver",
          "type": "bytes"
        },
        {
          "internalType": "address",
          "name": "zrc20",
          "type": "address"
        },
        {
          "internalType": "bytes",
          "name": "message",
          "type": "bytes"
        },
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "gasLimit",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "isArbitraryCall",
              "type": "bool"
            }
          ],
          "internalType": "struct CallOptions",
          "name": "callOptions",
          "type": "tuple"
        },
        {
          "components": [
            {
              "internalType": "bool",
              "name": "revertToOriginal",
              "type": "bool"
            },
            {
              "internalType": "string",
              "name": "revertMessage",
              "type": "string"
            }
          ],
          "internalType": "struct RevertOptions",
          "name": "revertOptions",
          "type": "tuple"
        }
      ],
      "name": "call",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "receiver",
          "type": "bytes"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "zrc20",
          "type": "address"
        },
        {
          "components": [
            {
              "internalType": "bool",
              "name": "revertToOriginal",
              "type": "bool"
            },
            {
              "internalType": "string",
              "name": "revertMessage",
              "type": "string"
            }
          ],
          "internalType": "struct RevertOptions",
          "name": "revertOptions",
          "type": "tuple"
        }
      ],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "receiver",
          "type": "bytes"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "zrc20",
          "type": "address"
        },
        {
          "internalType": "bytes",
          "name": "message",
          "type": "bytes"
        },
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "gasLimit",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "isArbitraryCall",
              "type": "bool"
            }
          ],
          "internalType": "struct CallOptions",
          "name": "callOptions",
          "type": "tuple"
        },
        {
          "components": [
            {
              "internalType": "bool",
              "name": "revertToOriginal",
              "type": "bool"
            },
            {
              "internalType": "string",
              "name": "revertMessage",
              "type": "string"
            }
          ],
          "internalType": "struct RevertOptions",
          "name": "revertOptions",
          "type": "tuple"
        }
      ],
      "name": "withdrawAndCall",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]