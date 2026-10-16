<?php
/** Add only the full-width teaser slice, preserving existing editorial input. */
use Drupal\canvas\Entity\JavaScriptComponent;
use Drupal\canvas\Entity\Component;
use Drupal\canvas\Entity\Page;
use Drupal\canvas_headless\ExternalComponentSync;
use Drupal\canvas_headless\FrontendUrl;
use Symfony\Component\Yaml\Yaml;

$root=dirname(DRUPAL_ROOT);
$metadata=Yaml::parseFile($root.'/frontend/components/alpina_product_teaser/component.yml');
// Native content-reference metadata supplies the Product-only autocomplete and resolves node fields.
$expressions=[
  'ℹ︎␜entity:node:product␝title␞␟value',
  'ℹ︎␜entity:node:product␝field_summary␞␟value',
  'ℹ︎␜entity:node:product␝field_product_link␞␟url',
  'ℹ︎␜entity:node:product␝field_teaser_image␞␟{alt↠alt,height↠height,src_with_alternate_widths↠src_with_alternate_widths,width↠width}',
];
$js=JavaScriptComponent::load('alpina_product_teaser');
if(!$js) {
  $js=JavaScriptComponent::create(['machineName'=>$metadata['machineName'],'name'=>$metadata['name'],'type'=>'external','status'=>TRUE,'props'=>$metadata['props']['properties'],'required'=>$metadata['required'],'slots'=>[], 'dataDependencies'=>['entityFields'=>['product'=>$expressions]]]);
} else $js->set('dataDependencies',['entityFields'=>['product'=>$expressions]]);
$violations=$js->getTypedData()->validate();
if($violations->count())throw new RuntimeException((string)$violations);
$js->save();
$definitions=[];
foreach(\Drupal::config('canvas_headless.settings')->get('frontends') as $frontend) {
  if($frontend['url']!=='http://localhost:3000')continue;
  foreach($frontend['components'] as $id) {
    if(in_array($id,['js.alpina_full_width_teaser','js.alpina_product_teaser'],TRUE))continue;
    $existing=JavaScriptComponent::load(substr($id,3));
    if($existing)$definitions[]=['machineName'=>$existing->id(),'name'=>$existing->label(),'status'=>$existing->status(),'props'=>$existing->get('props')?:[],'required'=>$existing->get('required')?:[],'slots'=>$existing->get('slots')?:[]];
  }
}
foreach(['alpina_full_width_teaser','alpina_product_teaser'] as $name) {
  $data=Yaml::parseFile("$root/frontend/components/$name/component.yml");$data['props']=$data['props']['properties'];$definitions[]=$data;
}
$result=\Drupal::service(ExternalComponentSync::class)->synchronize(FrontendUrl::fromConfig('http://localhost:3000'),['version'=>1,'components'=>$definitions]);
if($result['errors'])throw new RuntimeException(implode("\n",$result['errors']));
echo 'Components: '.json_encode($result)."\n";
function alpinaTeaserItem(string $id,array $inputs,?string $parent=NULL,?string $slot=NULL):array {
  $component=Component::load($id);
  return ['uuid'=>\Drupal::service('uuid')->generate(),'parent_uuid'=>$parent,'slot'=>$slot,'component_id'=>$id,'component_version'=>$component->getActiveVersion(),'inputs'=>json_encode($inputs,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE)];
}
function alpinaTeaserMedia(string $filename):int {
  $name='Alpina teaser background '.$filename;
  $storage=\Drupal::entityTypeManager()->getStorage('media');$found=$storage->loadByProperties(['bundle'=>'image','name'=>$name]);$media=reset($found);
  if(!$media) {
    $uri='public://alpina/'.$filename;$files=\Drupal::entityTypeManager()->getStorage('file')->loadByProperties(['uri'=>$uri]);$file=reset($files);
    if(!$file) {$file=\Drupal::service('file.repository')->writeData(file_get_contents(dirname(DRUPAL_ROOT).'/alpina-be-frontend/assets/'.$filename),$uri,\Drupal\Core\File\FileExists::Error);$file->setPermanent();$file->save();}
    $media=$storage->create(['bundle'=>'image','name'=>$name,'langcode'=>'en','status'=>1,'uid'=>1,'field_media_image'=>['target_id'=>$file->id(),'alt'=>'']]);$media->save();
  }
  return (int)$media->id();
}
$page=Page::load(16);$tree=$page->get('components')->getValue();
if(!array_filter($tree,static fn($item)=>$item['component_id']==='js.alpina_full_width_teaser')) {
  $section=alpinaTeaserItem('js.alpina_full_width_teaser',['heading'=>'Unsere Produkte']);$tree[]=$section;
  for($i=1;$i<=2;$i++) {
    $nodes=\Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['type'=>'product','field_product_code'=>sprintf('ALPINA-DEMO-%02d',$i)]);$product=reset($nodes);
    if(!$product)throw new RuntimeException('Run import-alpina-products.php first.');
    $tree[]=alpinaTeaserItem('js.alpina_product_teaser',['product'=>['target_id'=>$product->id()],'desktopBackground'=>['target_id'=>alpinaTeaserMedia("teaser-$i.jpg")],'mobileBackground'=>['target_id'=>alpinaTeaserMedia("teaser-$i-m.jpg")],'linkLabel'=>'jetzt entdecken'],$section['uuid'],'products');
  }
  $page->set('components',$tree);$violations=$page->validate();if($violations->count())throw new RuntimeException((string)$violations);$page->save();
}
echo "Teaser slice present on page 16.\n";
