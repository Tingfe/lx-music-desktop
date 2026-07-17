import { EventEmitter } from 'node:events'

const event = new EventEmitter()

export const onUserApiChanged = (listener: () => void) => {
  event.on('changed', listener)
  return () => event.off('changed', listener)
}

export const emitUserApiChanged = () => event.emit('changed')
