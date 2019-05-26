import React, { Component } from 'react';
import EthAvatarContract from './contracts/EthAvatar.json';
import getWeb3 from './utils/getWeb3';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Container from '@material-ui/core/Container';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import EthAvatarImage from './EthAvatarImage.js';
import EthAvatarForm from './EthAvatarForm.js';

//import './css/oswald.css';
//import './css/open-sans.css';
//import './css/pure-min.css';
import './App.css';


class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      web3: undefined,
      ethAddress: undefined,
      ethAvatarInstance: undefined,
      ethAvatarIPFSHash: undefined
    };
  }

  componentWillMount() {
    const app = this;
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
      .then(results => {
        results.web3.eth.getAccounts().then(accounts => {
          console.log("call");
          console.log("results:", results, accounts, app);
          app.setState({
            web3: results.web3,
            ethAddress: accounts[0]
          });

          // Instantiate contract once web3 provided.
          app.instantiateContract();

        }
        );

      })
      .catch(() => {
        this.setState({
          web3: null
        });
        console.log('Error finding web3.');
      });
  }

  instantiateContract = async () => {
    console.log("la");
    const app = this;
    const contract = require('truffle-contract');

    const networkId = await this.state.web3.eth.net.getId();
    const accounts = await this.state.web3.eth.getAccounts();

    const ethAvatarInstance = new this.state.web3.eth.Contract(
      EthAvatarContract.abi,
      EthAvatarContract.networks[networkId].address,
    );
    console.log(ethAvatarInstance);
    this.setState({
      ethAvatarInstance: ethAvatarInstance
    });

    // watch the DidSetIPFSHash event
    ethAvatarInstance.events.DidSetIPFSHash({
      filter: { myIndexedParam: [20, 23], myOtherIndexedParam: '0x123456789...' }, // Using an array means OR: e.g. 20 or 23
      fromBlock: 0
    }, function (error, event) {
      console.debug(event);
      // set the updated hash
      if (event.returnValues.hashAddress === accounts[0])
        app.setState({ ethAvatarIPFSHash: event.returnValues.hash });
    });
    console.log("before");
    // use ethAvatarInstance to retreive the hash of the current account
    var result = await ethAvatarInstance.methods.getIPFSHash(this.state.ethAddress).call();
    console.log("before:", result, ":");
    return this.setState({ ethAvatarIPFSHash: result });
  }

  render() {
    const styles = theme => ({
      root: {
        flexGrow: 1,
      },
      paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary,
      },
    });

    if (this.state.web3 === null) {
      return (
        // Display a web3 warning.
        <div className="App">
          <main className="container">
            <h1>⚠️</h1>
            <p>This browser has no connection to the Ethereum network. Please use the Chrome/FireFox extension MetaMask, or dedicated Ethereum browsers Mist or Parity.</p>
          </main>
        </div>
      );
    }

    if (this.state.ethAddress === null) {
      return (
        // Display a web3 warning.
        <div className="App">
          <main className="container">
            <h1>⚠️</h1>
            <p>MetaMask seems to be locked.</p>
          </main>
        </div>
      );
    }

    if (this.state.ethAvatarIPFSHash !== undefined) {
      return (
        <div className="root">
          <AppBar position="static">
            <Toolbar>
              <IconButton edge="start" color="inherit" aria-label="Menu">

              </IconButton>
              <Typography variant="h6" >
                News
          </Typography>
              <Button color="inherit">Login</Button>
            </Toolbar>
          </AppBar>
          <Container maxWidth="100%"   >
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <h1>Welcome to Eth Avatar!</h1>
              </Grid>
              <Grid item xs={6}>

                <h2>Current Ethereum Address: </h2><h3><code>{this.state.ethAddress}</code></h3>

              </Grid>
              <Grid item xs={6}>
                <Paper >
                  <h2>Associated Avatar: </h2>
                  <EthAvatarImage ethAvatarInstance={this.state.ethAvatarInstance} ethAddress={this.state.ethAddress} ipfsHash={this.state.ethAvatarIPFSHash} />
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper >

                </Paper>
              </Grid>
            </Grid>
            <EthAvatarForm ethAvatarInstance={this.state.ethAvatarInstance} ethAddress={this.state.ethAddress}></EthAvatarForm>

          </Container>
        </div>

      );
    }

    return (
      // Display a loading indicator.
      <div className="App">
        <main className="container">
          <h1>Loading EthAvatar...</h1>
        </main>
      </div>
    );

  }
}

export default App;
