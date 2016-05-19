#!/bin/bash
rm -r ./testchain
mkdir testchain
geth --datadir ./testchain init genesis.json
