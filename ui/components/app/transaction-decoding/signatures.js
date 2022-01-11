import React from 'react';
import TimestampRow from './components/row-components/timestamp/timestamp.component';
import DecimalsDisplay from './components/row-components/decimals/decimals.component';

/*
Function Signature Adding Guide

NOTE TO FUTURE REVIEWERS:
Please do not accept changes that perform any sort of manipulation of parameters besides formatting or typecasting.

MetaMask matches every parameter of a transaction call to this set of rules. The last rule the parameter matches will be applied to the
parameter thus modifiying the way parameter value looks like in the transaction decoding tab.

=========================
Callback Parameter Types
=========================
Here is the list of how different Solidity types are passed into the transform function. Anything that is not listed here is passed through form the 
tx-inisght backend, so please print the value to see how you can get the data you want from them. 

    uint => BigNumber
    address => String
    int => BigNumber
    uint[] => [BigNumber]
    string[] => [String]

=========================
Availiable Components
=========================
TimestampRow - converts epoch time into human readable string with relative time counter. 
Ex: 1643042830 => Jan 24 2022, 11:47 am (in 28 minutes)

@prop date: Number - epoch time as a regular integer.

DecimalsDisplay - converts uint into a human readable token amount and adds fiat conversion on certain chains.
Respects local currency selection of the user.
Ex: 1372930994980681733 => 1.3729 ($5.72)

@prop tokenAmount: BigNumber - raw parameter value to format
@prop tokenAddress: String - address to fetch the  decimal count and fiat price.

===============
Example One
===============
Let's cover a simple example first. We will make sure that a "deadline" parameter for the transaction to DEXes is presented in a human readable way. 

A lot of DEX smart contracts would have a function similar to this:

function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
) external returns (uint[] memory amounts);

The "deadline" parameter is usually an epoch time and looks something like this 1643042830, which is not very useful to a human.

In order to fix that we have added a rule below (line: ), so let's now look what it does. 
First we need to select the parameter name that we want to work with. We put it under property called "field". Note that we can use 
a regex here. If we new that some DEXes use parameter name "deadline" and others use "deadlineToSwap" we would put "deadline.*" under
the field property to match both cases. 

In order to tell MetaMask what to do with the value of the parameter we also need to write a "transform" function. Transform function will
take the value of the "field" property as an argument and should return a React component. In this case we created a TimestampRow component.
Feel free to reuse components we have created in your own rules. 

It is worth mentioning here that parameters are returned as the following types:

    uint => BigNumber
    address => String
    int => BigNumber
    uint[] => [BigNumber]
    string[] => [String]

That means that in our case the deadline parameter is going to be passed to us as BigNumber and we can use a toNumber() function like we did on line:

===============
Example Two
===============

Let's now consider a slightly more complex scenario. Let's show the token amounts for our swap transactions with correct number of decimal along side a 
fiat conversion rate. The trick here is that we would need to access the value of a different parameter in order to correctly determine token address and
fetch fiat price and decimal places.

Luckly we have already made a component that will do all the converstion for you if you supply it with the original amount as BigNumber
and the token address as a string. Componet is called DecimalsDisplay.

Now back to writing the rule. First of all we want to modify the "amountOut" parameter. Since we know that some of the other DEXes use "amountOutMinimum"
we will use the "amountOut.*" regex. In order to properly display the values we also need the last address in the "path" parameter. To obtain that we will put 
the name of that parameter in the array under the "detect" property. Note that items under detect could also be regexes. 

After we have done this we write the transform function with the only difference that values of the detect fielld are also passed as function arguments in the 
order they appear in the detect list.

We then pass this information to the DecimalDisplay component and it will take care of the rest. 

*/

export const signaturesData = [
  {
    field: 'deadline',
    transform(deadline) {
      return <TimestampRow date={deadline.toNumber()} />;
    },
  },
  {
    field: 'amountOut.*',
    detect: ['path'],
    transform(amountOut, path) {
      return (
        <DecimalsDisplay
          tokenAmount={amountOut}
          tokenAddress={path[path.length - 1]}
        />
      );
    },
  },
  {
    field: 'amountIn.*',
    detect: ['path'],
    transform(amountIn, path) {
      return <DecimalsDisplay tokenAmount={amountIn} tokenAddress={path[0]} />;
    },
  },
  {
    field: 'amountIn.*',
    detect: ['fromToken'],
    transform(amountIn, fromToken) {
      return (
        <DecimalsDisplay tokenAmount={amountIn} tokenAddress={fromToken} />
      );
    },
  },
];
