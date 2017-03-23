/* eslint-disable */
// @TODO fix issues
import React from 'react'
import Radium from 'radium'
import {FlatButton} from 'material-ui'
import Theme from '../../../styles/jolocom-theme'
import RegistrationStyles from '../styles'
import HoverButton from '../../common/hover-button'

// @FIX this will extend the RegistrationStyles
// Use Object.assign({}, ...) to clone the object
const STYLES = Object.assign(RegistrationStyles, {
  tile: {
    display: 'flex',
    maxwidth: '90%',
    height: '180px',
    width: '290px',
    alignItems: 'center',
    marginTop: '10px',
    marginBottom: '10px',
    borderRadius: '2px',
    primary: false,
    backgroundColor: Theme.jolocom.gray1,
    selectedColor: Theme.palette.primary1Color,
    textAlign: 'center',
    padding: '5%'
  },

  tileinside: {
    color: Theme.jolocom.gray5,
    display: 'flex',
    flexDirection: 'column',
    width: '80%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    margin: 'auto'
  },
  img: {
    position: 'relative',
    flex: 1,
    maxWidth: '100%',
    height: '80px',
    width: '300px',
    userSelect: 'none',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
    marginBottom: '10px'
    // @FIX watch these empty lines :)
  }

})

const UserType = (props) => {
  const messageWhy = (
    <div>
      If you select the Geek option, you are the keeper of your 
      passphrase that was randomly generated by the mouse moving you just did
      to uncover the picture. You must be prepared to keep the passphrase you
      in a safe place where you are not going to loose it and where others
      can't get to it. This phrase and a secret pin is how you 'login' to your
      wallet in the future. <br />If you select the No Hassle option, we will
      save your passphrase for you, but you will then need a password to get it.
   </div>
  )

  const messageConfirm = (
    <div>
      You have selected {props.value === 'expert'
      ? `'Geek'. Do you have pencil and paper ready to save your passphrase securely for accessing your wallet in the future?`
      : `'No hassle' and we'll save your passphrase for you`}
   </div>
  )
  
  const messageSelect = (
    <div>
      Please make a selection. If you are not sure, checkout 'WHY?'
    </div>
  )

  /* @FIX use () for multiline jsx
  return (
    <div/>
  )
  */
 
  // @FIX this code is very hard to read
  // use a getStyles function for dynamic styles, don't do it inline here
  // use methods for event handlers
  // eg: onClick={this._handleExpertClick}
  // actually this component is a bit too completed to be just a bare function :)
  return <div style={STYLES.container}>
    <div style={STYLES.header}>
      {'Hi ' + props.user + '!, are you...' /* @FIX use a string template */}
    </div>
    <div>
      <HoverButton
        backgroundColor={(props.value === 'expert'
        ? STYLES.tile.selectedColor : STYLES.tile.backgroundColor)}
        hoverColor={STYLES.tile.selectedColor}
        style={STYLES.tile}
        onClick={() => { props.onChange('expert'); props.onSubmit() }}>
        <div style={STYLES.tileinside}>
          <div style={{...STYLES.img, ...{
            backgroundImage: 'url(/img/img_techguy.svg)'
          }}} />...a total tech Geek and want to be in absolute control?
        </div>
      </HoverButton>
    </div>
    <div>
      <HoverButton
        backgroundColor={(props.value === 'layman'
        ? STYLES.tile.selectedColor : STYLES.tile.backgroundColor)}
        hoverColor={STYLES.tile.selectedColor}
        style={STYLES.tile}
        onClick={() => { props.onChange('layman'); props.onSubmit() }}>
        <div style={STYLES.tileinside}>
          <div style={{...STYLES.img, ...{
            backgroundImage: 'url(/img/img_nohustle.svg)'
          }}} />...the laid-back type, who doesn't want any hassle.
        </div>
      </HoverButton>
    </div>
    <div>
    </div>
    <div>
      <FlatButton onClick={() => {
        props.configSimpleDialog(messageWhy); props.showSimpleDialog()
      }}>
      WHY?
      </FlatButton>
    </div>
  </div>
}

UserType.propTypes = {
  value: React.PropTypes.string.isRequired,
  valid: React.PropTypes.bool.isRequired,
  onChange: React.PropTypes.func.isRequired,
  onSubmit: React.PropTypes.func.isRequired,
  openConfirmDialog: React.PropTypes.func,
  closeConfirmDialog: React.PropTypes.func,
  configSimpleDialog: React.PropTypes.func,
  showSimpleDialog: React.PropTypes.func,
  user: React.PropTypes.string
}

export default Radium(UserType)
/* eslint-enable */
