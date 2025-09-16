import { Box, Flex } from "@chakra-ui/react";
import { CameraWidget } from "./components/CameraWidget/CameraWidget";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Fabric } from "./components/Fabric/Fabric";

function App() {
  return (
    <Flex w="100vw" h="100vh">
      <Box flex="1" bg="black">
        <Canvas camera={{ position: [0, 1, 3], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 5, 5]} intensity={1.2} />
          <Fabric />
          <OrbitControls />
        </Canvas>
      </Box>
      <CameraWidget />
    </Flex>
  );
}

export default App;
