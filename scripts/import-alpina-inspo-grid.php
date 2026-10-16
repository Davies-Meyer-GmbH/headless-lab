<?php
/** Product-backed inspiration grid, with a separate order and preserved Canvas drafts. */
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;
use Drupal\Core\Entity\Entity\EntityFormDisplay;
use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\File\FileExists;
use Drupal\canvas\Entity\JavaScriptComponent;
use Drupal\canvas\Entity\Component;
use Drupal\canvas\Entity\Page;
use Drupal\canvas\AutoSave\AutoSaveManager;
use Drupal\canvas_headless\ExternalComponentSync;
use Drupal\canvas_headless\FrontendUrl;
use Symfony\Component\Yaml\Yaml;

$root=dirname(DRUPAL_ROOT);
$newOrder=!FieldStorageConfig::loadByName('node','field_inspiration_weight');
if($newOrder)FieldStorageConfig::create(['entity_type'=>'node','field_name'=>'field_inspiration_weight','type'=>'integer','cardinality'=>1])->save();
if(!FieldConfig::loadByName('node','product','field_inspiration_weight'))FieldConfig::create(['entity_type'=>'node','bundle'=>'product','field_name'=>'field_inspiration_weight','label'=>'Inspiration weight','default_value'=>[['value'=>100]],'description'=>'Managed through the Product inspiration order admin page.'])->save();
if(!FieldStorageConfig::loadByName('node','field_inspiration_image'))FieldStorageConfig::create(['entity_type'=>'node','field_name'=>'field_inspiration_image','type'=>'image','cardinality'=>1,'settings'=>['target_type'=>'file']])->save();
if(!FieldConfig::loadByName('node','product','field_inspiration_image'))FieldConfig::create(['entity_type'=>'node','bundle'=>'product','field_name'=>'field_inspiration_image','label'=>'Inspiration image','description'=>'Interior/lifestyle image shown by inspiration grids. Product name, collection, packshot and destination remain shared.','settings'=>['file_extensions'=>'png jpg jpeg webp','file_directory'=>'alpina/products','alt_field'=>TRUE,'alt_field_required'=>TRUE]])->save();
$display=EntityFormDisplay::load('node.product.default');$display->setComponent('field_inspiration_image',['type'=>'image_image','weight'=>7])->removeComponent('field_inspiration_weight')->save();
$directory='public://alpina/products';\Drupal::service('file_system')->prepareDirectory($directory,FileSystemInterface::CREATE_DIRECTORY|FileSystemInterface::MODIFY_PERMISSIONS);
$storage=\Drupal::entityTypeManager()->getStorage('node');$products=$storage->loadByProperties(['type'=>'product']);
$codes=['ALPINA-DEMO-03','ALPINA-DEMO-08','ALPINA-DEMO-04','ALPINA-DEMO-01','ALPINA-DEMO-07','ALPINA-DEMO-10','ALPINA-DEMO-06','ALPINA-DEMO-05'];
uasort($products,static function($a,$b)use($codes){$ac=$a->get('field_product_code')->value;$bc=$b->get('field_product_code')->value;$ai=array_search($ac,$codes,TRUE);$bi=array_search($bc,$codes,TRUE);return (($ai===FALSE?100:$ai)<=>($bi===FALSE?100:$bi))?:strcmp($ac,$bc);});
$i=0;$updated=0;
foreach($products as $product){$changed=FALSE;
  if($product->get('field_inspiration_image')->isEmpty()){
    $filename='inspo-'.($i%8+1).'.jpg';$uri="$directory/$filename";$found=\Drupal::entityTypeManager()->getStorage('file')->loadByProperties(['uri'=>$uri]);$file=reset($found);
    if(!$file){$file=\Drupal::service('file.repository')->writeData(file_get_contents("$root/alpina-be-frontend/assets/$filename"),$uri,FileExists::Error);$file->setPermanent();$file->save();}
    $product->set('field_inspiration_image',['target_id'=>$file->id(),'alt'=>'Interior inspiration for '.$product->label()]);$changed=TRUE;
  }
  if($newOrder||$product->get('field_inspiration_weight')->isEmpty()){$product->set('field_inspiration_weight',$i);$changed=TRUE;}
  if($changed){$violations=$product->validate();if($violations->count())throw new RuntimeException((string)$violations);$product->save();$updated++;}$i++;
}
$definitions=[];
foreach(\Drupal::config('canvas_headless.settings')->get('frontends') as $frontend){if($frontend['url']!=='http://localhost:3000')continue;foreach($frontend['components'] as $id){if($id==='js.alpina_inspo_grid')continue;$js=JavaScriptComponent::load(substr($id,3));if($js)$definitions[]=['machineName'=>$js->id(),'name'=>$js->label(),'status'=>$js->status(),'props'=>$js->get('props')?:[],'required'=>$js->get('required')?:[],'slots'=>$js->get('slots')?:[]];}}
$meta=Yaml::parseFile("$root/frontend/components/alpina_inspo_grid/component.yml");$meta['props']=$meta['props']['properties'];$definitions[]=$meta;
$result=\Drupal::service(ExternalComponentSync::class)->synchronize(FrontendUrl::fromConfig('http://localhost:3000'),['version'=>1,'components'=>$definitions]);if($result['errors'])throw new RuntimeException(implode("\n",$result['errors']));
$page=Page::load(16);$tree=$page->get('components')->getValue();
if(!array_filter($tree,static fn($item)=>$item['component_id']==='js.alpina_inspo_grid')){
  $manager=\Drupal::service(AutoSaveManager::class);$draft=$manager->getAutoSaveEntity($page);$entry=\Drupal::keyValue('canvas.auto_save')->get('canvas_page:16:en');
  $item=['uuid'=>\Drupal::service('uuid')->generate(),'parent_uuid'=>NULL,'slot'=>NULL,'component_id'=>'js.alpina_inspo_grid','component_version'=>Component::load('js.alpina_inspo_grid')->getActiveVersion(),'inputs'=>json_encode(['heading'=>$meta['props']['heading']['examples'][0],'text'=>$meta['props']['text']['examples'][0],'numberOfProducts'=>8],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)];
  $tree[]=$item;$page->set('components',$tree);$violations=$page->validate();if($violations->count())throw new RuntimeException((string)$violations);$page->save();
  if(!$draft->isEmpty()){
    $pending=$draft->entity;$pendingTree=$pending->get('components')->getValue();$pendingTree[]=$item;$pending->set('components',$pendingTree);
    $account=\Drupal::entityTypeManager()->getStorage('user')->load($entry['owner']);$switcher=\Drupal::service('account_switcher');$switcher->switchTo($account);
    try{$manager->saveEntity($pending,$draft->clientId);}finally{$switcher->switchBack();}
    if($conflict=$manager->getUnresolvedConflictForEntity($page))$manager->resolveConflict($page,$conflict);
    echo "Preserved existing unpublished Canvas edits and appended the grid to the draft.\n";
  }
}
echo "Updated $updated of ".count($products)." existing Products; no new Product nodes. Inspo grid added.\n";
