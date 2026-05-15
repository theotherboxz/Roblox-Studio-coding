'use client';

import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { 
  Folder, Box, FileCode, Terminal, Camera, Globe, Map as MapIcon, ChevronRight, 
  ChevronDown, MoreVertical, ScrollText, FileCode2, Mountain, Cog, Users, Lightbulb, 
  Palette, Database, Cloud, Server, Layout, Briefcase, User, Flag, Volume2, 
  MessageSquare, Copy, Zap, Image as ImageIcon, Sparkles, Hash, Type, Link, Play, Activity, Settings, Maximize, Target, GripHorizontal, Component, Compass, Eye, Move, Plus, X, Search
} from 'lucide-react';
import { NodeObject, ObjectType } from '../types';

const ALL_OBJECT_TYPES: ObjectType[] = [
  'Workspace', 'Camera', 'Terrain', 'SpawnLocation', 'Baseplate',
  'Players', 'Lighting', 'MaterialService', 'ReplicatedFirst', 'ReplicatedStorage',
  'ServerScriptService', 'ServerStorage', 'StarterGui', 'StarterPack', 'StarterPlayer', 
  'Teams', 'SoundService', 'TextChatService',
  'Part', 'WedgePart', 'CornerWedgePart', 'TrussPart', 'MeshPart', 'UnionOperation', 'NegateOperation', 'SpecialMesh', 'Model', 'Folder', 'Tool', 'Handle', 'Seat',
  'Script', 'LocalScript', 'ModuleScript',
  'BindableEvent', 'BindableFunction', 'RemoteEvent', 'RemoteFunction',
  'BloomEffect', 'BlurEffect', 'ColorCorrectionEffect', 'DepthOfFieldEffect', 'SunRaysEffect', 'PointLight', 'SpotLight', 'SurfaceLight',
  'ScreenGui', 'SurfaceGui', 'BillboardGui', 'Frame', 'ScrollingFrame', 'ImageLabel', 'ImageButton', 'TextLabel', 'TextButton', 'TextBox', 'VideoFrame', 'ViewportFrame', 'UIAspectRatioConstraint', 'UICorner', 'UIGradient', 'UIGridLayout', 'UIListLayout', 'UIPadding', 'UIPageLayout', 'UIScale', 'UIStroke', 'UITableLayout', 'UITextSizeConstraint',
  'Animation', 'AnimationController', 'Animator', 'Sound', 'SoundGroup', 'EqualizerSoundEffect', 'ReverbSoundEffect', 'ChorusSoundEffect', 'CompressorSoundEffect', 'DistortionSoundEffect', 'EchoSoundEffect', 'FlangeSoundEffect', 'PitchShiftSoundEffect', 'TremoloSoundEffect',
  'Attachment', 'BallSocketConstraint', 'HingeConstraint', 'PrismaticConstraint', 'RodConstraint', 'RopeConstraint', 'SpringConstraint', 'TorsionSpringConstraint', 'UniversalConstraint', 'WeldConstraint', 'NoCollisionConstraint', 'AlignOrientation', 'AlignPosition', 'AngularVelocity', 'LinearVelocity', 'Torque', 'VectorForce',
  'BodyAngularVelocity', 'BodyForce', 'BodyGyro', 'BodyPosition', 'BodyThrust', 'BodyVelocity', 'RocketPropulsion',
  'ParticleEmitter', 'Fire', 'Smoke', 'Sparkles', 'Beam', 'Trail', 'SelectionBox', 'SelectionSphere',
  'Humanoid', 'HumanoidDescription', 'ForceField',
  'Weld', 'Motor', 'Motor6D', 'Snap', 'Glue', 'ManualWeld',
  'IntValue', 'NumberValue', 'StringValue', 'BoolValue', 'Vector3Value', 'CFrameValue', 'Color3Value', 'ObjectValue', 'RayValue', 'BrickColorValue', 'DoubleConstrainedValue', 'IntConstrainedValue',
  'Configuration', 'ClickDetector', 'ProximityPrompt', 'Decal', 'Texture', 'HopperBin'
];

export function ExplorerPanel() {
  const { objects, selectedId, setSelectedId, setObjects, setOpenScriptIds, setActiveScriptId, openScriptIds } = useAppContext();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['workspace', 'starter-player', 'server-script-service']));
  const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getIcon = (type: string) => {
    switch (type) {
      // Core/Services
      case 'Folder': return <Folder className="text-[#ffcc00]" size={14} />;
      case 'Camera': return <Camera className="text-[#00a2ff]" size={14} />;
      case 'Baseplate': return <MapIcon className="text-[#ff4444]" size={14} />;
      case 'Workspace': return <Globe className="text-[#00a2ff]" size={14} />;
      case 'Terrain': return <Mountain className="text-[#33cc33]" size={14} />;
      case 'SpawnLocation': return <Target className="text-[#cccccc]" size={14} />;
      case 'Players': return <Users className="text-[#00cc44]" size={14} />;
      case 'Lighting': return <Lightbulb className="text-[#ffff00]" size={14} />;
      case 'MaterialService': return <Palette className="text-[#ff9900]" size={14} />;
      case 'ReplicatedFirst': return <Copy className="text-[#00a2ff]" size={14} />;
      case 'ReplicatedStorage': return <Database className="text-[#00a2ff]" size={14} />;
      case 'ServerScriptService': return <Cloud className="text-[#00a2ff]" size={14} />;
      case 'ServerStorage': return <Server className="text-[#00cc44]" size={14} />;
      case 'StarterGui': return <Layout className="text-[#ffcc00]" size={14} />;
      case 'StarterPack': return <Briefcase className="text-[#ffcc00]" size={14} />;
      case 'StarterPlayer': return <User className="text-[#ffcc00]" size={14} />;
      case 'Teams': return <Flag className="text-[#ffcc00]" size={14} />;
      case 'SoundService': return <Volume2 className="text-[#00a2ff]" size={14} />;
      case 'TextChatService': return <MessageSquare className="text-[#cccccc]" size={14} />;
      
      // Scripts
      case 'Script': return <ScrollText className="text-[#00ff88]" size={14} />;
      case 'LocalScript': return <FileCode2 className="text-[#00ff88]" size={14} />;
      case 'ModuleScript': return <FileCode className="text-[#00ff88]" size={14} />;

      // Events
      case 'BindableEvent':
      case 'BindableFunction':
      case 'RemoteEvent':
      case 'RemoteFunction':
        return <Zap className="text-[#ffcc00]" size={14} />;

      // UI
      case 'ScreenGui':
      case 'SurfaceGui':
      case 'BillboardGui':
      case 'Frame':
      case 'ScrollingFrame':
        return <Layout className="text-[#cccccc]" size={14} />;
      case 'ImageLabel':
      case 'ImageButton':
      case 'VideoFrame':
        return <ImageIcon className="text-[#00a2ff]" size={14} />;
      case 'TextLabel':
      case 'TextButton':
      case 'TextBox':
        return <Type className="text-[#cccccc]" size={14} />;
      case 'ViewportFrame': return <Eye className="text-[#00a2ff]" size={14} />;

      // Lighting Effects
      case 'BloomEffect':
      case 'BlurEffect':
      case 'ColorCorrectionEffect':
      case 'DepthOfFieldEffect':
      case 'SunRaysEffect':
      case 'PointLight':
      case 'SpotLight':
      case 'SurfaceLight':
        return <Lightbulb className="text-[#ffcc00]" size={14} />;

      // Animations & Sounds
      case 'Animation':
      case 'AnimationController':
      case 'Animator':
        return <Play className="text-[#00ff88]" size={14} />;
      case 'Sound':
      case 'SoundGroup':
      case 'EqualizerSoundEffect':
      case 'ReverbSoundEffect':
      case 'ChorusSoundEffect':
      case 'CompressorSoundEffect':
      case 'DistortionSoundEffect':
      case 'EchoSoundEffect':
      case 'FlangeSoundEffect':
      case 'PitchShiftSoundEffect':
      case 'TremoloSoundEffect':
        return <Volume2 className="text-[#00a2ff]" size={14} />;

      // Attachments & Constraints
      case 'Attachment': return <Component className="text-[#cccccc]" size={14} />;
      case 'BallSocketConstraint':
      case 'HingeConstraint':
      case 'PrismaticConstraint':
      case 'RodConstraint':
      case 'RopeConstraint':
      case 'SpringConstraint':
      case 'TorsionSpringConstraint':
      case 'UniversalConstraint':
      case 'WeldConstraint':
      case 'NoCollisionConstraint':
        return <Link className="text-[#cccccc]" size={14} />;
      case 'AlignOrientation':
      case 'AlignPosition':
      case 'AngularVelocity':
      case 'LinearVelocity':
      case 'Torque':
      case 'VectorForce':
        return <Compass className="text-[#ff9900]" size={14} />;

      // Movers
      case 'BodyAngularVelocity':
      case 'BodyForce':
      case 'BodyGyro':
      case 'BodyPosition':
      case 'BodyThrust':
      case 'BodyVelocity':
      case 'RocketPropulsion':
        return <Move className="text-[#ff9900]" size={14} />;

      // Particles & Effects
      case 'ParticleEmitter':
      case 'Fire':
      case 'Smoke':
      case 'Sparkles':
      case 'Beam':
      case 'Trail':
        return <Sparkles className="text-[#ffbb00]" size={14} />;
      case 'SelectionBox':
      case 'SelectionSphere':
        return <Maximize className="text-[#00a2ff]" size={14} />;

      // Humanoid
      case 'Humanoid':
      case 'HumanoidDescription':
        return <User className="text-[#00cc44]" size={14} />;

      // Joints & Welds
      case 'Weld':
      case 'Motor':
      case 'Motor6D':
      case 'Snap':
      case 'Glue':
      case 'ManualWeld':
        return <GripHorizontal className="text-[#cccccc]" size={14} />;

      // Values
      case 'IntValue':
      case 'NumberValue':
      case 'IntConstrainedValue':
      case 'DoubleConstrainedValue':
        return <Activity className="text-[#aaaaaa]" size={14} />;
      case 'StringValue':
        return <Type className="text-[#aaaaaa]" size={14} />;
      case 'BoolValue':
      case 'Vector3Value':
      case 'CFrameValue':
      case 'Color3Value':
      case 'ObjectValue':
      case 'RayValue':
      case 'BrickColorValue':
        return <Hash className="text-[#aaaaaa]" size={14} />;

      // Misc
      case 'Configuration': return <Settings className="text-[#aaaaaa]" size={14} />;
      case 'ClickDetector':
      case 'ProximityPrompt':
        return <Target className="text-[#00a2ff]" size={14} />;
      case 'Decal':
      case 'Texture':
        return <ImageIcon className="text-[#ff9900]" size={14} />;

      // Default Parts
      case 'Part':
      case 'WedgePart':
      case 'CornerWedgePart':
      case 'TrussPart':
      case 'MeshPart':
      case 'SpecialMesh':
      case 'UnionOperation':
      case 'NegateOperation':
      case 'Model':
      case 'Tool':
      case 'Handle':
      case 'Seat':
      default: return <Box className="text-gray-300" size={14} />;
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedIds(newExpanded);
  };

  const handleDoubleClick = (obj: NodeObject) => {
    if (obj.type === 'Script' || obj.type === 'LocalScript') {
      if (!openScriptIds.includes(obj.id)) {
        setOpenScriptIds([...openScriptIds, obj.id]);
      }
      setActiveScriptId(obj.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setSelectedId(id);
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  React.useEffect(() => {
    window.addEventListener('click', closeContextMenu);
    return () => window.removeEventListener('click', closeContextMenu);
  }, []);

  const moveItem = (id: string, dir: -1 | 1) => {
    const objIndex = objects.findIndex(o => o.id === id);
    if (objIndex < 0) return;
    const obj = objects[objIndex];
    // Find siblings
    const siblings = objects.filter(o => o.parentId === obj.parentId);
    const sibIndex = siblings.findIndex(o => o.id === id);
    if (sibIndex + dir >= 0 && sibIndex + dir < siblings.length) {
      const targetId = siblings[sibIndex + dir].id;
      const targetIndex = objects.findIndex(o => o.id === targetId);
      const newObjs = [...objects];
      // swap in main array
      newObjs[objIndex] = objects[targetIndex];
      newObjs[targetIndex] = obj;
      setObjects(newObjs);
    }
  };

  const deleteItem = (id: string) => {
    // Delete item and all children
    const toDelete = new Set<string>();
    const gather = (currId: string) => {
      toDelete.add(currId);
      objects.filter(o => o.parentId === currId).forEach(o => gather(o.id));
    };
    gather(id);
    setObjects(objects.filter(o => !toDelete.has(o.id)));
    if (selectedId && toDelete.has(selectedId)) setSelectedId(null);
  };

  const renameItem = (id: string) => {
    const obj = objects.find(o => o.id === id);
    if (!obj) return;
    const newName = prompt('Enter new name:', obj.name);
    if (newName && newName.trim()) {
      setObjects(objects.map(o => o.id === id ? { ...o, name: newName.trim() } : o));
    }
  };

  const addObject = (type: ObjectType) => {
    const newId = `obj-${crypto.randomUUID()}`;
    const newObj: NodeObject = {
      id: newId,
      type,
      name: type,
      parentId: selectedId || 'workspace' // Default to workspace if nothing selected
    };
    setObjects([...objects, newObj]);
    setExpandedIds(new Set([...expandedIds, newObj.parentId!]));
    setSelectedId(newId);
    setShowAddModal(false);
    setSearchQuery('');
  };

  const renderNode = (parentId: string | null, depth = 0) => {
    const children = objects.filter(o => o.parentId === parentId);
    if (children.length === 0) return null;

    return children.map(obj => {
      const hasChildren = objects.some(o => o.parentId === obj.id);
      const isExpanded = expandedIds.has(obj.id);
      const isSelected = selectedId === obj.id;

      return (
        <div key={obj.id}>
          <div 
            onClick={() => setSelectedId(obj.id)}
            onDoubleClick={() => handleDoubleClick(obj)}
            onContextMenu={(e) => handleContextMenu(e, obj.id)}
            className={`flex items-center gap-1 py-0.5 cursor-pointer select-none opacity-80 hover:opacity-100
              ${isSelected ? 'bg-[#00a2ff33] rounded-sm border border-[#00a2ff66]' : ''}
            `}
            style={{ paddingLeft: `${depth * 14 + 4}px` }}
          >
            <div className="w-3 h-3 flex items-center justify-center mr-1" onClick={(e) => toggleExpand(obj.id, e)}>
              {hasChildren ? (isExpanded ? <ChevronDown size={10} className="text-[#666]" /> : <ChevronRight size={10} className="text-[#666]" />) : null}
            </div>
            <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap text-xs">
              {getIcon(obj.type)}
              <span className="truncate">{obj.name}</span>
            </div>
          </div>
          {isExpanded && renderNode(obj.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="w-64 flex-shrink-0 bg-[#222222] border-l border-[#333333] flex flex-col h-full text-[#e8e8e8] relative">
      <div className="p-2 border-b border-[#333333] bg-[#2d2d2d] flex justify-between items-center">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#aaaaaa]">Explorer</span>
        <button 
          onClick={() => setShowAddModal(true)}
          className="text-[#aaaaaa] hover:text-white p-0.5 rounded-sm hover:bg-[#444]"
          title="Insert Object"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 text-xs font-sans select-none relative">
        {renderNode(null)}
      </div>

      {/* Properties Section */}
      <div className="h-48 border-t border-[#333333] flex flex-col bg-[#1b1b1b]">
        <div className="p-2 bg-[#2d2d2d] border-b border-[#333333] text-[11px] font-bold uppercase tracking-wider text-[#aaaaaa]">Properties</div>
        <div className="flex-1 p-2 flex flex-col gap-1 overflow-y-auto custom-scroll">
          {selectedId ? (() => {
            const selectedObj = objects.find(o => o.id === selectedId);
            if (!selectedObj) return <div className="text-[#888888] text-[10px]">Nothing selected</div>;
            return (
              <>
                <div className="flex border-b border-[#2d2d2d] py-1 text-[10px]">
                  <span className="w-20 text-[#888888]">Name</span>
                  <input 
                    type="text" 
                    className="flex-1 bg-transparent border border-transparent focus:border-[#00a2ff] focus:bg-[#2d2d2d] outline-none text-[#cccccc] px-1 -ml-1 text-[10px] w-full"
                    value={selectedObj.name}
                    onChange={(e) => {
                      setObjects(objects.map(o => o.id === selectedId ? { ...o, name: e.target.value } : o));
                    }}
                  />
                </div>
                <div className="flex border-b border-[#2d2d2d] py-1 text-[10px]">
                  <span className="w-20 text-[#888888]">Type</span>
                  <span className="flex-1 truncate">{selectedObj.type}</span>
                </div>
                <div className="flex border-b border-[#2d2d2d] py-1 text-[10px]">
                  <span className="w-20 text-[#888888]">Parent</span>
                  <span className="flex-1 text-[#00a2ff] truncate">{objects.find(o => o.id === selectedObj.parentId)?.name || 'None'}</span>
                </div>
              </>
            );
          })() : <div className="text-[#888888] text-[10px]">Select an object</div>}
        </div>
      </div>

      {contextMenu && (
        <div 
          className="fixed bg-[#282828] border border-[#444444] shadow-lg py-1 rounded-sm text-xs z-50 w-40 text-[#cccccc]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="px-4 py-1.5 hover:bg-[#00a2ff] hover:text-white cursor-pointer" onClick={() => { setShowAddModal(true); closeContextMenu(); }}>Insert Object...</div>
          <div className="border-t border-[#444444] my-1"></div>
          <div className="px-4 py-1.5 hover:bg-[#00a2ff] hover:text-white cursor-pointer" onClick={() => renameItem(contextMenu.id)}>Rename</div>
          <div className="px-4 py-1.5 hover:bg-[#00a2ff] hover:text-white cursor-pointer" onClick={() => deleteItem(contextMenu.id)}>Delete</div>
          <div className="border-t border-[#444444] my-1"></div>
          <div className="px-4 py-1.5 hover:bg-[#00a2ff] hover:text-white cursor-pointer" onClick={() => moveItem(contextMenu.id, -1)}>Move Up</div>
          <div className="px-4 py-1.5 hover:bg-[#00a2ff] hover:text-white cursor-pointer" onClick={() => moveItem(contextMenu.id, 1)}>Move Down</div>
        </div>
      )}

      {showAddModal && (
        <div className="absolute inset-0 z-40 bg-[#1e1e1e] border-l border-[#333333] flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between p-2 border-b border-[#333333] bg-[#2d2d2d]">
            <span className="text-xs font-bold text-[#aaaaaa]">Insert Object</span>
            <button onClick={() => setShowAddModal(false)} className="text-[#aaaaaa] hover:text-white">
              <X size={14} />
            </button>
          </div>
          <div className="p-2 border-b border-[#333333]">
            <div className="relative">
              <Search className="absolute left-2 top-1.5 text-[#666]" size={12} />
              <input
                type="text"
                autoFocus
                placeholder="Search objects..."
                className="w-full bg-[#111111] border border-[#444444] rounded-sm text-xs py-1 pl-6 pr-2 text-[#cccccc] focus:border-[#00a2ff] outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1 custom-scroll">
            {ALL_OBJECT_TYPES.filter(type => type.toLowerCase().includes(searchQuery.toLowerCase())).map(type => (
              <div 
                key={type}
                className="flex items-center gap-2 py-1.5 px-2 cursor-pointer hover:bg-[#00a2ff33] rounded-sm text-xs truncate"
                onClick={() => addObject(type)}
              >
                {getIcon(type)}
                <span className="text-[#cccccc] truncate">{type}</span>
              </div>
            ))}
            {ALL_OBJECT_TYPES.filter(type => type.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <div className="text-center text-[#666] p-4 text-xs">No objects found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
