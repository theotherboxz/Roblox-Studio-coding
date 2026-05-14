export type ObjectType = 
  | 'Workspace' | 'Camera' | 'Terrain' | 'SpawnLocation' | 'Baseplate'
  | 'Players' | 'Lighting' | 'MaterialService' | 'ReplicatedFirst' | 'ReplicatedStorage'
  | 'ServerScriptService' | 'ServerStorage' | 'StarterGui' | 'StarterPack' | 'StarterPlayer' 
  | 'Teams' | 'SoundService' | 'TextChatService'
  | 'Part' | 'WedgePart' | 'CornerWedgePart' | 'TrussPart' | 'MeshPart' | 'UnionOperation' | 'NegateOperation' | 'SpecialMesh' | 'Model' | 'Folder' | 'Tool' | 'Handle' | 'Seat'
  | 'Script' | 'LocalScript' | 'ModuleScript'
  | 'BindableEvent' | 'BindableFunction' | 'RemoteEvent' | 'RemoteFunction'
  | 'BloomEffect' | 'BlurEffect' | 'ColorCorrectionEffect' | 'DepthOfFieldEffect' | 'SunRaysEffect' | 'PointLight' | 'SpotLight' | 'SurfaceLight'
  | 'ScreenGui' | 'SurfaceGui' | 'BillboardGui' | 'Frame' | 'ScrollingFrame' | 'ImageLabel' | 'ImageButton' | 'TextLabel' | 'TextButton' | 'TextBox' | 'VideoFrame' | 'ViewportFrame' | 'UIAspectRatioConstraint' | 'UICorner' | 'UIGradient' | 'UIGridLayout' | 'UIListLayout' | 'UIPadding' | 'UIPageLayout' | 'UIScale' | 'UIStroke' | 'UITableLayout' | 'UITextSizeConstraint'
  | 'Animation' | 'AnimationController' | 'Animator' | 'Sound' | 'SoundGroup' | 'EqualizerSoundEffect' | 'ReverbSoundEffect' | 'ChorusSoundEffect' | 'CompressorSoundEffect' | 'DistortionSoundEffect' | 'EchoSoundEffect' | 'FlangeSoundEffect' | 'PitchShiftSoundEffect' | 'TremoloSoundEffect'
  | 'Attachment' | 'BallSocketConstraint' | 'HingeConstraint' | 'PrismaticConstraint' | 'RodConstraint' | 'RopeConstraint' | 'SpringConstraint' | 'TorsionSpringConstraint' | 'UniversalConstraint' | 'WeldConstraint' | 'NoCollisionConstraint' | 'AlignOrientation' | 'AlignPosition' | 'AngularVelocity' | 'LinearVelocity' | 'Torque' | 'VectorForce'
  | 'BodyAngularVelocity' | 'BodyForce' | 'BodyGyro' | 'BodyPosition' | 'BodyThrust' | 'BodyVelocity' | 'RocketPropulsion'
  | 'ParticleEmitter' | 'Fire' | 'Smoke' | 'Sparkles' | 'Beam' | 'Trail' | 'SelectionBox' | 'SelectionSphere'
  | 'Humanoid' | 'HumanoidDescription' | 'ForceField'
  | 'Weld' | 'Motor' | 'Motor6D' | 'Snap' | 'Glue' | 'ManualWeld'
  | 'IntValue' | 'NumberValue' | 'StringValue' | 'BoolValue' | 'Vector3Value' | 'CFrameValue' | 'Color3Value' | 'ObjectValue' | 'RayValue' | 'BrickColorValue' | 'DoubleConstrainedValue' | 'IntConstrainedValue'
  | 'Configuration' | 'ClickDetector' | 'ProximityPrompt' | 'Decal' | 'Texture' | 'HopperBin';

export interface NodeObject {
  id: string;
  type: ObjectType;
  name: string;
  parentId: string | null;
  code?: string;
}

export type AgentMode = 'Standard' | 'Executing' | 'Coding';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
