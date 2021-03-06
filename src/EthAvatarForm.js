import React, { Component } from 'react';
import AvatarImageCropper from 'react-avatar-image-cropper';
import ReactLoading from 'react-loading';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Grid from '@material-ui/core/Grid';
var ipfsAPI = require('ipfs-api');

class EthAvatarForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedImageFile: null,
      selectedImageURL: null,
      title: null,

      uploadStarted: false,
      uploadComplete: false,
      uploadSuccessful: false,

      open: false,
      buttonVisible: false
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClickOpen = this.handleClickOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }
  handleClickOpen() {
    this.setState({ open: true });
  }

  handleClose() {
    this.setState({ open: false });
  }
  // handle apply avatar cropping
  handleApplyCropper = (file) => {
    this.setState({
      selectedImageFile: file,
      selectedImageURL: window.URL.createObjectURL(file)
    });
  }

  // handle form input change
  handleInputChange(event) {
    console.log(event);
//    const name = event.target.name;
    const value = event.target.value;

    this.setState({
      "title": value
    });
  }

  // handle form submit
  handleSubmit(event) {
    event.preventDefault();

    if (!this.state.selectedImageFile) {
      alert('Please select an Avatar image');
      return;
    }

    // update loading UI
    this.setState({ uploadStarted: true });
    console.log("Start update");
    // First upload image to IPFS and get its hash
    var ipfs = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' }); // connect to the unfura IPFS node

    var fileReader = new FileReader();
    fileReader.readAsArrayBuffer(this.state.selectedImageFile);
    fileReader.onload = () => {
      var data = fileReader.result;
      var buffer = Buffer.from(data);
      console.log("loaded, adding to ipfs");

      ipfs.files.add(buffer, (err, result) => {
        if (err) {
          this.setState({ uploadComplete: true, uploadSuccessful: false });

          console.error('**Error uploading image to IPFS: ' + err);
          return;
        }

        var imageHash = result[0].hash;
        console.log("✓ image successfully uploaded to IPFS with hash: " + imageHash);

        // Now create another IPFS entry with the full avatar data (image hash + metadata)
        var avatarData = {
          imageHash: imageHash,
          title: this.state.title
        };
        var app = this;
        var avatarDataBuffer = Buffer.from(JSON.stringify(avatarData));
        ipfs.files.add(avatarDataBuffer, (err, result) => {
          if (err) {
            this.setState({ uploadComplete: true, uploadSuccessful: false });

            console.error('**Error uploading avatar data to IPFS: ' + err);
            return;
          }

          var avatarDataHash = result[0].hash;
          console.log("✓ avatarData successfully uploaded to IPFS with hash: " + avatarDataHash);

          // Finally, write avatarDataHash to the smart contract
          var ethAvatarInstance = this.props.ethAvatarInstance;

          // watch the DidSetIPFSHash event
          ethAvatarInstance.events.DidSetIPFSHash({
            filter: {
              fromBlock: 'latest',
              toBlock: 'pending'
            }
          }, function (error, event) {
            console.debug(event);
            if (!app.state.uploadStarted || event.returnValues.hashAddress !== app.props.ethAddress)
              return;

            if (error) {
              app.setState({ uploadComplete: true, uploadSuccessful: false });

              console.error('**Error uploading avatar data to the smart contract: ' + err);
              return;
            }

            console.log("✓ avatarDataHash successfully written to smart contract!");
            app.setState({ uploadComplete: true, uploadSuccessful: true });

          });


          // call setIPFSHash
          ethAvatarInstance.methods.setIPFSHash(avatarDataHash).send({ from: this.props.ethAddress });
        });
      });
    }
  }

  renderMain() {

    if (!this.state.uploadStarted) {
      return (
        <div className="eth-avatar-form">
            <Grid container spacing={3}>
              <Grid item xs={6}>
          <div className="avatar-image-cropper" style={{ width: '250px', height: '250px', border: '1px solid black' }}>
            <AvatarImageCropper apply={this.handleApplyCropper} text='Upload Avatar' />
          </div>
          </Grid>
          <Grid item xs={6}>
          <div className="avatar-preview">
            <img src={this.state.selectedImageURL} alt="presentation" />
          </div>
          </Grid>
          </Grid>
          <form className="avatar-metadata" onSubmit={this.handleSubmit}>

            <TextField
              autoFocus
              margin="dense"
              id="title"
              label="Title (optionnal)"
              type="text"
              onChange={this.handleInputChange}
              fullWidth
            />

            <br />
            <br />
            <Button type="submit" color="primary">
              Save on Ethereum
          </Button>
          </form>
        </div>
      );
    }

    if (!this.state.uploadComplete) {
      return (
        <div className="avatar-uploading">
          <h2>Uploading your avatar to the Ethereum blockchain...</h2>
          <p>Please be patient, this can take several minutes</p>
          <ReactLoading type='cylon' color='black' />
        </div>
      );
    }

    if (this.state.uploadSuccessful) {
      return (
        <div className="avatar-uploading">
          <h2>Congratulations! You now have a new EthAvatar set!</h2>
        </div>
      );
    }

    return (
      <div className="avatar-uploading">
        <h2>ERROR: Error uploading your avatar to the blockchain. Please try again later.</h2>
      </div>
    );
  }

  render() {

    console.log("state:", this.state);
    return (
      <div style={{ display: this.state.buttonVisible ? "none" : "" }} >
        <Button variant="outlined" color="primary" onClick={this.handleClickOpen}>
          Modify your avatar
      </Button>
        <Dialog open={this.state.open} onClose={this.handleClose} aria-labelledby="form-dialog-title">
          <DialogTitle id="form-dialog-title">Modify your Ethereum Avatar</DialogTitle>
          <DialogContent>
            {this.renderMain()}
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} color="primary">
              Close
          </Button>

          </DialogActions>
        </Dialog>
      </div>
    );
  }

}

export default EthAvatarForm;
