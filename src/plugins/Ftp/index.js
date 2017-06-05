const html = require('yo-yo')
const Plugin = require('../Plugin')
const FtpProvider = require('../../uppy-base/src/plugins/Ftp')

const View = require('../../generic-provider-views/index')
const icons = require('./icons')

module.exports = class Ftp extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'acquirer'
    this.id = 'Ftp'
    this.title = 'Ftp'
    this.stateId = 'Ftp'
    this.params = {

    }
    this.icon = () => html`
      <svg class="UppyIcon" width="128" height="118" viewBox="0 0 128 118">
        <path d="M38.145.777L1.108 24.96l25.608 20.507 37.344-23.06z"/>
        <path d="M1.108 65.975l37.037 24.183L64.06 68.525l-37.343-23.06zM64.06 68.525l25.917 21.633 37.036-24.183-25.61-20.51z"/>
        <path d="M127.014 24.96L89.977.776 64.06 22.407l37.345 23.06zM64.136 73.18l-25.99 21.567-11.122-7.262v8.142l37.112 22.256 37.114-22.256v-8.142l-11.12 7.262z"/>
      </svg>
    `

    // writing out the key explicitly for readability the key used to store
    // the provider instance must be equal to this.id.
    this.Ftp = new FtpProvider(this.opts, this.params)

    this.files = []

    // this.onAuth = this.onAuth.bind(this)
    // Visual
    this.render = this.render.bind(this)

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  install () {
    this.view = new View(this)
    // Set default state
    this.core.setState({
      // writing out the key explicitly for readability the key used to store
      // the plugin state must be equal to this.stateId.
      Ftp: {
        authenticated: false,
        files: [],
        folders: [],
        directories: [],
        activeRow: -1,
        filterInput: ''
      }
    })

    // View overrides
    // ==============
    // These are needed as the generic provider methods written
    // differ the ones needed for this plugin
    this.view.handleAuth = this.handleAuth.bind(this)
    this.view.getFolder = this.getFolder.bind(this)
    this.view.logout = this.logout.bind(this)
    this.view.addFile = this.addFile.bind(this)

    const target = this.opts.target
    const plugin = this
    this.target = this.mount(target, plugin)
    return
  }

  handleAuth() {
    this.view.updateState({loading : true})
    this.view.getFolder()
  }

  uninstall () {
    this.unmount()
  }

  isFolder (item) {
    return item.is_dir
  }

  getItemData (item) {
    return Object.assign({}, item, {size: item.file_size})
  }

  getItemIcon (item) {
    return icons['page_white']
  }

  getItemSubList (item) {
    return item.contents
  }

  getItemName (item) {
    return item.file_name
  }

  getMimeType (item) {
    return item.mime_type
  }

  getItemId (item) {
    return item.rev
  }

  getItemRequestPath (item) {
    return encodeURIComponent(this.getItemName(item))
  }

  getItemModifiedDate (item) {
    return item.modified
  }

  getFolder() {
     this.Ftp.list().then((resp) => {
       if (resp.Status === 'Error') {
         this.view.updateState({
           error: resp.Message
         })
         return
       }

       for (let file of resp.Data.Files) {
        file.acquirer = this.id;
       }
       // Success - display files
      this.view.updateState({
          files: resp.Data.Files,
          authenticated: true,
          loading: false
      }) 
    })
  }

  addFile (file) {
    const tagFile = {
      source: this.id,
      data: this.getItemData(file),
      name: this.getItemName(file),
      type: this.getMimeType(file),
      isRemote: true,
      body: {
        fileId: this.getItemId(file)
      },
      remote: {
        host: this.opts.host,
        url: '',
        body: {
          fileId: this.getItemId(file)
        }
      }
    }

    this.core.emitter.emit('core:file-add', tagFile)
    setTimeout((tagFile) => {
      let fileId;
      let files = this.core.getState().files;
      // Find file in this collection and get id
      // Then invoke upload success automatically
      for (let fileIndex in files) {
        if (tagFile.name === files[fileIndex].name) {
          fileId = fileIndex;
        }
      }
      this.core.emitter.emit('core:upload-success', fileId)
    }, 2000, tagFile);
  }

  logout() {
    this.view.updateState({ authenticated: false })
  }

  render (state) {
    return this.view.render(state)
  }
}
