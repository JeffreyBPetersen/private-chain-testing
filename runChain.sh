#!/bin/bash
geth --datadir testchain --networkid 403 --nodiscover --maxpeers 0 --rpc --rpcapi 'eth,miner,personal,web3' --rpccorsdomain null console
