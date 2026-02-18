import { ChevronUp, ChevronDown } from 'lucide-react'
import { useEditorActions } from '../../store'
import { ToolbarButton } from '../toolbar/ToolbarButton'

interface BlockMoverProps {
  clientId: string
}

export function BlockMover({ clientId }: BlockMoverProps) {
  const { moveBlockUp, moveBlockDown } = useEditorActions()

  return (
    <>
      <ToolbarButton
        icon={<ChevronUp size={18} />}
        tooltip="Move up"
        onClick={() => moveBlockUp(clientId)}
      />
      <ToolbarButton
        icon={<ChevronDown size={18} />}
        tooltip="Move down"
        onClick={() => moveBlockDown(clientId)}
      />
    </>
  )
}
