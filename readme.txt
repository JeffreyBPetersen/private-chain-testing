run setup script when starting fresh

use run script to start geth each time

to clean: delete testchain directory

to deploy contracts
  include your desired contracts
    create a copy of testSource.js
    replace the quasi-quoted code with your own
    replace "testSource.js" in test.html with the name of your new source file
  launch test.html
  generate a new account or select an existing one
  mine some ether on it
    * mining can take a while to start
  unlock the account
  "Compile Source"
  enter constructor arguments if applicable and click deploy on the desired contract
  mine until an address appears for the deployed instance of the contract
