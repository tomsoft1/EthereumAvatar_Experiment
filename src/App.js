import React, { Component } from 'react';
import EthAvatarContract from './contracts/EthAvatar.json';
import getWeb3 from './utils/getWeb3';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Container from '@material-ui/core/Container';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField'
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
      myAddress:undefined,
      ethAvatarInstance: undefined,
      ethAvatarIPFSHash: undefined
    };
    this.myRef = React.createRef();
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
            ethAddress: accounts[0],
            myAddress: accounts[0]
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

    const networkId = await this.state.web3.eth.net.getId();
    const accounts = await this.state.web3.eth.getAccounts();
  
    const ethAvatarInstance = new this.state.web3.eth.Contract(
      EthAvatarContract.abi,
      EthAvatarContract.networks[networkId].address,
    );
    console.log(ethAvatarInstance);
    this.setState({
      ethAvatarInstance: ethAvatarInstance,
   
    });

    // watch the DidSetIPFSHash event
    ethAvatarInstance.events.DidSetIPFSHash({
      filter: {
        fromBlock: 'latest',
        toBlock: 'pending'
      }
    }, function (error, event) {
      console.debug("Event:",event);
      // set the updated hash
      if (event.returnValues.hashAddress === app.state.ethAddress)
        app.setState({ ethAvatarIPFSHash: event.returnValues.hash });
    });
//    this.refs.address.getInputNode().value =accounts[0];

    this.updateAdress(accounts[0]);
  }
  updateAdress = async(address) =>{
    try{
      this.setState({ethAddress:address});
      console.log("before");
      // use ethAvatarInstance to retreive the hash of the current account
      var result = await this.state.ethAvatarInstance.methods.getIPFSHash(address).call();
      console.log("before:", result, ":");
      return this.setState({ ethAvatarIPFSHash: result });  
    }catch(e){
      alert(e.message);
    }
  }
 handleChange = name => event => {
    this.setState({ ethAvatarInstance: event.target.value });
    this.updateAdress(event.target.value);
  };

  render() {
    window.debug = this;
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
            <h1><span>⚠️</span></h1>
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
                EthAvatar
          </Typography>
             
            </Toolbar>
          </AppBar>
          <Container >
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <h1>Welcome to Eth Avatar!</h1>
                Associate an avatar with your ethereum address, and reuse this in any DApp application
              </Grid>
              <Grid item xs={6}>
              </Grid>
              <Grid item xs={6}>
                <Paper >
                  Associated Avatar of: 
                  <TextField
                    autoFocus
                    margin="dense"
                    id="address"
                    ref="address"
                    defaultValue={this.state.ethAddress}
                    label="Eth Address"

                    onKeyPress={(ev) => {
                      console.log(`Pressed keyCode ${ev.key}`);
                      if (ev.key === 'Enter') {
                        // Do code here
                        ev.preventDefault();
                        this.updateAdress(ev.target.value);
                      }
                    }}
                    type="text"
                    fullWidth
                  />
                  <EthAvatarImage ethAvatarInstance={this.state.ethAvatarInstance} ethAddress={this.state.ethAddress} ipfsHash={this.state.ethAvatarIPFSHash} />
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper >
                <h2>Current Ethereum Address: </h2><h3><code>{this.state.myAddress}</code></h3>

                <EthAvatarForm ethAvatarInstance={this.state.ethAvatarInstance} ethAddress={this.state.myAddress}></EthAvatarForm>

                </Paper>
              </Grid>
            </Grid>

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
