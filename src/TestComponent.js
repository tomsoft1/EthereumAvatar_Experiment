import React from "react";
import Button from '@material-ui/core/Button';

class TestComponent extends React.Component {
  state = { stackId: null };

  constructor(props, context) {
    super(props)
    console.log("Context:",context);
    console.log("Props:",props); 
    
    this.testMe = this.testMe.bind(this);
    }

  handleKeyDown = e => {
    // if the enter key is pressed, set the value with the string
    if (e.keyCode === 13) {
      this.setValue(e.target.value);
    }
  };

  setValue = value => {
    const { drizzle, drizzleState } = this.props;
    const contract = drizzle.contracts.MyStringStore;

    // let drizzle know we want to call the `set` method with `value`
    const stackId = contract.methods["set"].cacheSend(value, {
      from: drizzleState.accounts[0]
    });

    // save the `stackId` for later reference
    this.setState({ stackId });
  };

  getTxStatus = () => {
    // get the transaction states from the drizzle state
    const { transactions, transactionStack } = this.props.drizzleState;

    // get the transaction hash using our saved `stackId`
    const txHash = transactionStack[this.state.stackId];

    // if transaction hash does not exist, don't display anything
    if (!txHash) return null;

    // otherwise, return the transaction status
    return `Transaction status: ${transactions[txHash] && transactions[txHash].status}`;
  };
  testMe = async()=> {
      console.log("Called",this.props.drizzleState);
      const web3=this.props.drizzle.web3;
      const signature = await new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
          method: 'personal_sign',
          params: [web3.utils.utf8ToHex("MyData"), this.props.drizzleState.accounts[0]],
          from: this.props.drizzleState.accounts[0],
        }, (err, response) => {
          if(err) return reject(err);
          resolve(response.result);
        });
      });
      console.log("Signature:",signature);
  }
  render() {
    return (
      <div>
        <input type="text" onKeyDown={this.handleKeyDown} />
        <div>{this.getTxStatus()}</div>
        <Button variant="contained" onClick={this.testMe} color="primary">
      Test
    </Button>
      </div>
    );
  }
}
export default TestComponent;