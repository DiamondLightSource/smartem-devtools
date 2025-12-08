/**
 * CryoEM instrument definitions for DLS eBIC facility.
 */

export interface CryoEMInstrument {
  name: string
  alias: string
}

export const microscopeList: CryoEMInstrument[] = [
  { name: 'Krios 1', alias: 'm02' },
  { name: 'Krios 2', alias: 'm03' },
  { name: 'Krios 3', alias: 'm06' },
  { name: 'Krios 4', alias: 'm07' },
  { name: 'Krios 5', alias: 'm08' },
  { name: 'Talos', alias: 'm04' },
  { name: 'Scios', alias: 'm05' },
  { name: 'Glacios 1', alias: 'm10' },
  { name: 'Glacios 2', alias: 'm12' },
  { name: 'Aquilos', alias: 'm11' },
  { name: 'Leica cryoCLEM', alias: 'm14' },
]

export default microscopeList
