import { hashValuesToArray, collectFromHash } from './object'

/*
TODO: somehow infer OtherArgs from masterCallback?
TODO: infer RefType from masterCallback if provided
*/
export default class RefMap<RefType> {

  public currentMap: { [key: string]: RefType } = {}
  private depths: { [key: string]: number } = {}
  private callbackMap: { [key: string]: (val: RefType | null) => void } = {}


  constructor(public masterCallback?: (val: RefType | null, key: string) => void) {
  }


  createRef(key: string | number) {
    let refCallback = this.callbackMap[key]

    if (!refCallback) {
      refCallback = this.callbackMap[key] = (val: RefType | null) => {
        this.handleValue(val, String(key))
      }
    }

    return refCallback
  }


  handleValue = (val: RefType | null, key: string) => { // bind in case users want to pass it around
    let { depths, currentMap } = this
    let removed = false
    let added = false

    if (val !== null) {
      removed = (key in currentMap) // for bug
      currentMap[key] = val
      depths[key] = (depths[key] || 0) + 1
      added = true

    } else if (--depths[key] === 0) {
      delete currentMap[key]
      delete this.callbackMap[key]
      removed = true
    }

    if (this.masterCallback) {
      if (removed) {
        this.masterCallback(null, String(key))
      }
      if (added) {
        this.masterCallback(val, String(key))
      }
    }
  }


  collect( // TODO: check callers that don't care about order. should use getAll instead
    startIndex?: number,
    endIndex?: number,
    step?: number
  ) {
    return collectFromHash(this.currentMap, startIndex, endIndex, step)
  }


  getAll(): RefType[] { // returns in no partical order!
    return hashValuesToArray(this.currentMap)
  }

}