import { BlockEditor } from './BlockEditor'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <BlockEditor
        initialTitle="Hello World"
        initialBlocks={[]}
        onSave={(payload) => {
          console.log('Saved:', payload)
        }}
      />
    </div>
  )
}
