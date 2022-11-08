import fetch from 'node-fetch';

export async function securityProviderCheck(requestData) {
    console.log('requestData: ', requestData);
    // const queryString = new URLSearchParams(requestData[0]).toString();
    // console.log('queryString: ', queryString);

    const response = await fetch('http://localhost:3000/security/2', {
        // const response = await fetch('https://eos9d7dmfj.execute-api.us-east-1.amazonaws.com/metamask/validate', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-API-Key': 'NKYIN6cXkFaNnVIfzNx7s1z0p3b0B4SB6k29qA7n',
          },
    });
  
    return await response.json();   
}